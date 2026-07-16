function App() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--accent-primary)' }}>
        AnimePlayerLocal
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
        Thiết lập dự án Monorepo đã hoàn tất. Frontend và Backend đang hoạt động ổn định trên môi trường thử nghiệm.
      </p>
    </div>
  );
}

export default App;
