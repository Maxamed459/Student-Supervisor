function Logo({ compact = false, light = false }) {
  return (
    <div className={`brand-logo ${compact ? "compact" : ""} ${light ? "light" : ""}`}>
      <div className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="40" height="40">
          <rect width="48" height="48" rx="12" fill={light ? "#2170E4" : "#001E40"} />
          <path
            d="M10 30V18.5L24 11l14 7.5V30l-14 7.5L10 30zm14-14.2L14.8 20.3 24 25.2l9.2-4.9L24 15.8zm-10.2 7.7V28l8.2 4.4v-6.4l-8.2-2.5zm20.4 0-8.2 2.5v6.4L34.2 28v-4.5z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      <div className="brand-text">
        <strong>SSMS</strong>
        {!compact && <span>Student–Supervisor</span>}
      </div>
    </div>
  );
}

export default Logo;
