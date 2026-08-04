import { redirect } from 'next/navigation';

export default function UserSlugRoot({ params }: { params: { slug: string } }) {
  redirect(`/u/${params.slug}/cv`);
}
