import { PageLayout } from '@/components/page-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tear-images')({
  component: TearImagesPage,
})

function TearImagesPage() {
  return <PageLayout title="Tear images">{null}</PageLayout>
}
