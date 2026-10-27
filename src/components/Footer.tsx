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
          <span className="footer-label">Specification map</span>
          <ul>
            <li>
              <b>1.1</b> Binomial &amp; Poisson models, cumulative probabilities
            </li>
            <li>
              <b>1.2</b> Mean and variance
            </li>
            <li>
              <b>1.3</b> Poisson approximation to the binomial
            </li>
          </ul>
        </div>

        <div className="footer-note">
          <span className="footer-label">A note</span>
          <p>
            Not endorsed by Pearson. No past-paper content is reproduced. Aligned in
            spirit to Unit S2 (WST02), Issue 3.
          </p>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>Built for curious statisticians.</span>
        <span>B(n, p) × Po(λ)</span>
      </div>
    </footer>
  )
}
