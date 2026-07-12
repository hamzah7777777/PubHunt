import { useState } from 'react';

// The event instructions, shared by the landing page (always open) and the
// team portal (collapsed behind a button) — one copy so they can't drift.
export default function InstructionsPanel({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="panel panel-secondary">
      {!alwaysOpen && (
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%' }}
          onClick={() => setOpen(prev => !prev)}
        >
          Instructions
        </button>
      )}

      {(alwaysOpen || open) && (
        <div style={{ marginTop: alwaysOpen ? 0 : 16, textAlign: 'left' }}>
          <h3 style={{ marginBottom: 12 }}>Instructions (please read carefully)</h3>
          <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.75 }}>
            <li>Follow the clues to each pub in order, then head to the final venue (wristbands required).</li>
            <li>Please visit all pubs on your route &mdash; we need to maintain good relationships with them to keep Pub Hunt running in future.</li>
            <li>Complete the en-route video and photo challenges.</li>
            <li>Answer the questions for each pub along the way in the Route tab.</li>
            <li>Complete the video game quiz (5 rounds), plus the Team Name Quiz &mdash; find out all other teams&rsquo; names and match them to the correct picture when submitting.</li>
            <li>Remember to eat along the way.</li>
            <li>Enjoy yourselves (within reason).</li>
            <li>You&rsquo;ll visit four pubs in total, then the final venue. Please follow the suggested timings in the Route tab.</li>
            <li>We have private hire of the venue from 10:00pm. Entry is Pub Hunt wristband only &mdash; please don&rsquo;t arrive before 10:00pm.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
