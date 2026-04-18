export type BrukerChannelUnit = 'nm' | 'V' | 'deg' | 'unknown'

export interface BrukerChannel {
  name: string
  width: number
  height: number
  dataNm: Float32Array
  unit: BrukerChannelUnit
  minValue: number
  maxValue: number
  rms: number
}

export interface BrukerParsed {
  channels: BrukerChannel[]
  scanSizeNm: number
  pixelSizeNm: number
  scanDate: string
  instrumentDescription: string
}

const HEADER_END_MARKER = '\\*File list end'
const IMAGE_LIST_DELIMITER = '\\*Ciao image list'
const SCANNER_LIST_DELIMITER = '\\*Scanner list'
const MAX_HEADER_BYTES = 65536

function findBytes(haystack: Uint8Array, needle: Uint8Array, limit: number): number {
  const max = Math.min(haystack.length, limit) - needle.length
  outer: for (let i = 0; i <= max; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

function decodeLatin1(bytes: Uint8Array, start: number, end: number): string {
  let s = ''
  for (let i = start; i < end; i++) {
    s += String.fromCharCode(bytes[i])
  }
  return s
}

function getField(section: string, key: string): string | null {
  const lines = section.split(/\r?\n/)
  for (const raw of lines) {
    let line = raw.trim()
    if (!line) continue
    // Bruker regular fields begin with '\' and Ciao params begin with '\@';
    // strip leading backslashes before matching so callers can pass plain keys
    // like "Scan Size" or "@2:Image Data".
    while (line.startsWith('\\')) line = line.slice(1)
    if (!line.startsWith(key)) continue
    let rest = line.slice(key.length)
    if (rest.startsWith(' ')) rest = rest.trimStart()
    if (!rest.startsWith(':')) continue
    return rest.slice(1).trim()
  }
  return null
}

function parseInteger(value: string | null): number | null {
  if (value == null) return null
  const m = /-?\d+/.exec(value)
  if (!m) return null
  return Number.parseInt(m[0], 10)
}

function parseScanSizeNm(value: string | null): number | null {
  if (value == null) return null
  const numMatch = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/.exec(value)
  if (!numMatch) return null
  const v = Number.parseFloat(numMatch[0])
  const lower = value.toLowerCase()
  if (/\bnm\b/.test(lower) || lower.includes('nanomet')) return v
  if (
    lower.includes('µm') ||
    lower.includes('um') ||
    lower.includes('~m') ||
    lower.includes('micro')
  )
    return v * 1000
  if (lower.includes('pm')) return v / 1000
  if (lower.includes('mm')) return v * 1_000_000
  return v
}

function parseZScaleVPerLsb(value: string | null): number | null {
  if (value == null) return null
  const m = /\(([\d.eE+-]+)\s*V\/LSB\)/.exec(value)
  if (m) return Number.parseFloat(m[1])
  const m2 = /([\d.eE+-]+)\s*V\/LSB/.exec(value)
  if (m2) return Number.parseFloat(m2[1])
  return null
}

function parseTrailingFloat(value: string | null): number | null {
  if (value == null) return null
  const matches = value.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g)
  if (!matches || matches.length === 0) return null
  return Number.parseFloat(matches[matches.length - 1])
}

function parseZSensNmPerV(value: string | null): number | null {
  if (value == null) return null
  const m = /([\d.eE+-]+)\s*nm\/V/.exec(value)
  if (m) return Number.parseFloat(m[1])
  return parseTrailingFloat(value)
}

function parseImageDataName(value: string | null): string | null {
  if (value == null) return null
  const m = /\[([^\]]+)\]/.exec(value)
  if (m) return m[1].trim()
  return value.trim()
}

function unitForChannel(name: string): BrukerChannelUnit {
  const lower = name.toLowerCase()
  if (lower.includes('height')) return 'nm'
  if (lower.includes('phase')) return 'deg'
  if (lower.includes('amplitude') || lower.includes('error') || lower.includes('deflection')) return 'V'
  return 'unknown'
}

function flipVertically(data: Float32Array, width: number, height: number): void {
  const row = new Float32Array(width)
  for (let y = 0; y < Math.floor(height / 2); y++) {
    const top = y * width
    const bot = (height - 1 - y) * width
    row.set(data.subarray(top, top + width))
    data.copyWithin(top, bot, bot + width)
    data.set(row, bot)
  }
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = sorted.length >> 1
  if (sorted.length % 2 === 1) return sorted[mid]
  return (sorted[mid - 1] + sorted[mid]) / 2
}

function subtractRowMedians(data: Float32Array, width: number, height: number): void {
  const buf = new Array<number>(width)
  for (let y = 0; y < height; y++) {
    const off = y * width
    for (let x = 0; x < width; x++) buf[x] = data[off + x]
    const m = median(buf)
    for (let x = 0; x < width; x++) data[off + x] -= m
  }
}

function subtractPlaneFit(data: Float32Array, width: number, height: number): void {
  const n = width * height
  if (n === 0) return
  let sumX = 0
  let sumY = 0
  let sumZ = 0
  let sumXX = 0
  let sumYY = 0
  let sumXY = 0
  let sumXZ = 0
  let sumYZ = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const z = data[y * width + x]
      sumX += x
      sumY += y
      sumZ += z
      sumXX += x * x
      sumYY += y * y
      sumXY += x * y
      sumXZ += x * z
      sumYZ += y * z
    }
  }
  const m11 = sumXX - (sumX * sumX) / n
  const m12 = sumXY - (sumX * sumY) / n
  const m22 = sumYY - (sumY * sumY) / n
  const r1 = sumXZ - (sumX * sumZ) / n
  const r2 = sumYZ - (sumY * sumZ) / n
  const det = m11 * m22 - m12 * m12
  if (det === 0) return
  const a = (r1 * m22 - r2 * m12) / det
  const b = (m11 * r2 - m12 * r1) / det
  const c = (sumZ - a * sumX - b * sumY) / n
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] -= a * x + b * y + c
    }
  }
}

function computeStats(data: Float32Array): { min: number; max: number; rms: number } {
  if (data.length === 0) return { min: 0, max: 0, rms: 0 }
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let sum = 0
  for (const v of data) {
    if (v < min) min = v
    if (v > max) max = v
    sum += v
  }
  const mean = sum / data.length
  let sqSum = 0
  for (const v of data) {
    const d = v - mean
    sqSum += d * d
  }
  return { min, max, rms: Math.sqrt(sqSum / data.length) }
}

export function parseBruker(bytes: Uint8Array): BrukerParsed {
  if (bytes.length < 64) {
    throw new Error('Bruker file too small to contain a header')
  }

  const marker = new TextEncoder().encode(HEADER_END_MARKER)
  const headerEndIdx = findBytes(bytes, marker, MAX_HEADER_BYTES)
  if (headerEndIdx === -1) {
    throw new Error(`Bruker header end marker '${HEADER_END_MARKER}' not found in first ${String(MAX_HEADER_BYTES)} bytes`)
  }
  const headerEnd = headerEndIdx + marker.length
  const headerText = decodeLatin1(bytes, 0, headerEnd)

  const sections = headerText.split(IMAGE_LIST_DELIMITER)
  const preamble = sections[0]
  const imageSections = sections.slice(1)

  if (imageSections.length === 0) {
    throw new Error('Bruker header contains no image sections')
  }

  const scannerSplit = preamble.split(SCANNER_LIST_DELIMITER)
  const scannerSection = scannerSplit.length > 1 ? scannerSplit[1] : preamble
  const globalZSensNmPerV = parseZSensNmPerV(getField(scannerSection, '@Sens. Zsens'))

  const scanDate = getField(preamble, 'Date') ?? ''
  const instrumentDescription =
    getField(preamble, 'Description') ??
    getField(preamble, 'Microscope Description') ??
    getField(preamble, 'Profile name') ??
    ''

  let scanSizeNm: number | null = null
  for (const s of imageSections) {
    const v = parseScanSizeNm(getField(s, 'Scan Size'))
    if (v != null && v > 0) {
      scanSizeNm = v
      break
    }
  }
  if (scanSizeNm == null) {
    const v = parseScanSizeNm(getField(preamble, 'Scan Size'))
    if (v != null && v > 0) scanSizeNm = v
  }
  if (scanSizeNm == null) {
    throw new Error('Bruker header missing Scan Size field')
  }

  const channels: BrukerChannel[] = []
  let lastSeenZSens = globalZSensNmPerV

  for (const section of imageSections) {
    const sectionZSens = parseZSensNmPerV(getField(section, '@Sens. Zsens'))
    if (sectionZSens != null) lastSeenZSens = sectionZSens

    const rawName = parseImageDataName(getField(section, '@2:Image Data'))
    if (!rawName) continue

    const width = parseInteger(getField(section, 'Samps/line'))
    const height = parseInteger(getField(section, 'Number of lines'))
    const dataOffset = parseInteger(getField(section, 'Data offset'))
    const dataLength = parseInteger(getField(section, 'Data length'))

    if (width == null || height == null || dataOffset == null || dataLength == null) {
      continue
    }
    if (width <= 0 || height <= 0) continue

    const expectedBytes = width * height * 2
    const usableBytes = Math.max(0, Math.min(dataLength, expectedBytes, bytes.length - dataOffset))
    if (usableBytes < expectedBytes && usableBytes <= 0) continue

    const view = new DataView(bytes.buffer, bytes.byteOffset + dataOffset, usableBytes)
    const raw = new Float32Array(width * height)
    const samples = Math.floor(usableBytes / 2)
    for (let i = 0; i < samples; i++) {
      raw[i] = view.getInt16(i * 2, true)
    }

    const unit = unitForChannel(rawName)
    let scale = 1
    if (unit === 'nm') {
      const vPerLsb = parseZScaleVPerLsb(getField(section, '@2:Z scale'))
      const zMagnify = parseTrailingFloat(getField(section, '@Z magnify'))
      const zSens = lastSeenZSens
      if (vPerLsb != null && zMagnify != null && zSens != null) {
        scale = zMagnify * vPerLsb * zSens
      }
    } else if (unit === 'V') {
      const vPerLsb = parseZScaleVPerLsb(getField(section, '@2:Z scale'))
      const zMagnify = parseTrailingFloat(getField(section, '@Z magnify')) ?? 1
      if (vPerLsb != null) scale = zMagnify * vPerLsb
    } else if (unit === 'deg') {
      const trailingDeg = parseTrailingFloat(getField(section, '@2:Z scale'))
      if (trailingDeg != null && width * height > 0) {
        scale = trailingDeg / 32768
      }
    }

    if (scale !== 1) {
      for (let i = 0; i < raw.length; i++) raw[i] *= scale
    }

    flipVertically(raw, width, height)
    subtractRowMedians(raw, width, height)
    subtractPlaneFit(raw, width, height)
    const stats = computeStats(raw)

    channels.push({
      name: rawName,
      width,
      height,
      dataNm: raw,
      unit,
      minValue: stats.min,
      maxValue: stats.max,
      rms: stats.rms,
    })
  }

  if (channels.length === 0) {
    throw new Error('Bruker file parsed but no usable channels were extracted')
  }

  const referenceWidth = channels[0].width
  const pixelSizeNm = scanSizeNm / referenceWidth

  return {
    channels,
    scanSizeNm,
    pixelSizeNm,
    scanDate,
    instrumentDescription,
  }
}
