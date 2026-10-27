export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <a className="brand footer-brand" href="#top">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            S2<span>//</span>LAB
          </a>
          <p>
            An independent interactive study resource for Edexcel International A Level
            Statistics 2.
          </p>
        </div>

        <div className="footer-map">
          <span className="footer-label">Notes map</span>
          <ul>
            <li>
              <b>1.1</b> Binomial distribution, mean and variance
            </li>
            <li>
              <b>1.2</b> Poisson distribution, mean and variance
            </li>
            <li>
              <b>1.3</b> Poisson and Normal approximations, continuity correction
            </li>
          </ul>
        </div>

        <div className="footer-note">
          <span className="footer-label">A note</span>
          <p>
            Not endorsed by Pearson. No past-paper content or question examples are
            reproduced. Based on the LS2 Chapter 1 notes.
          </p>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>Built for curious statisticians.</span>
        <span>Bin(n, p) × Po(λ)</span>
      </div>
    </footer>
  )
}
