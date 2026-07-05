// Client-side helper: uploads a file to local storage via /api/upload.
// kind "image"    -> admin-only, returns a public url  (package images)
// kind "document" -> any signed-in user, returns a public url (appointment docs)
// kind "deliverable" -> admin-only, returns a private path served by /api/deliverables
export async function uploadFile(
  file: File,
  kind: "image" | "document" | "deliverable",
  idToken: string
): Promise<{ name: string; path: string; url: string | null }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/upload?kind=${kind}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Upload failed");
  }
  return data;
}
