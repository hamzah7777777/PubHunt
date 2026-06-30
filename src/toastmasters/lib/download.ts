export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(filename: string, lines: string[]) {
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  triggerDownload(blob, filename);
}
