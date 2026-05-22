export function CrayonFilters() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="crayonWobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.028"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" />
        </filter>

        <filter id="crayonWobbleLight" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03 0.04"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" />
        </filter>

        <filter id="crayonWobbleStrong" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.024"
            numOctaves="3"
            seed="11"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" />
        </filter>

        <filter id="crayonInk" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="4"
            result="grain"
          />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1.4 -0.5"
            result="speckle"
          />
          <feComposite in="speckle" in2="SourceGraphic" operator="in" result="speckled" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="speckled" />
          </feMerge>
        </filter>

        <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            seed="2"
            result="paper"
          />
          <feColorMatrix
            in="paper"
            type="matrix"
            values="0 0 0 0 0.16
                    0 0 0 0 0.13
                    0 0 0 0 0.09
                    0 0 0 0.08 0"
          />
          <feComposite operator="in" in2="SourceGraphic" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
