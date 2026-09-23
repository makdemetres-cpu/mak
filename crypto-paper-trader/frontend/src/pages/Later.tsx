export function Later({ title, summary }: { title: string; summary: string }) {
  return (
    <>
      <h1>{title}</h1>
      <section className="card empty">
        <p>{summary}</p>
        <p className="small faint" style={{ marginTop: 8 }}>This section isn’t built yet.</p>
      </section>
    </>
  )
}
