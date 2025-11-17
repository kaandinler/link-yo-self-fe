import { useParams } from 'next/navigation';

export default function useLanguage(): string {
  const params = useParams();
  const language = params.language as string;

  // Default language if not found
  return language || 'en';
}
