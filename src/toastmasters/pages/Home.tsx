import { Brand, Button } from '../components/ui';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Brand size="lg" />
      <p className="max-w-sm text-sm text-neutral-500">
        Event email sign-up tool. Organizer? Head to the admin area. Scanned a
        QR code at an event? Use the link it gave you.
      </p>
      <a href="/toastmasters/admin/">
        <Button>Admin login</Button>
      </a>
    </main>
  );
}
