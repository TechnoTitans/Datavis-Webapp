import PropTypes from 'prop-types'

/**
 * Field visualization component for auto paths
 * @param {Object} props - Component props
 * @param {string} props.autoPath - Auto path string to visualize
 * @param {string} props.position - Position string from database
 * @returns {JSX.Element} - Field visualization component
 */
const FieldVisualization = ({ autoPath, position }) => {
  const allianceColor = '#2563eb'
  const backgroundColor = '#1a1a1a'

  // Position mapping based on your SVG coordinates (clockwise from top-left)
  const positions = {
    'A': { x: 727, y: 761 },   // A/B pair - left
    'B': { x: 727, y: 761 },   // Same as A
    'C': { x: 847, y: 553 },   // C/D pair - top-left
    'D': { x: 847, y: 553 },   // Same as C
    'E': { x: 1087, y: 553 },  // E/F pair - top-right
    'F': { x: 1087, y: 553 },  // Same as E
    'G': { x: 1207, y: 761 },  // G/H pair - right
    'H': { x: 1207, y: 761 },  // Same as G
    'I': { x: 1087, y: 969 },  // I/J pair - bottom-right
    'J': { x: 1087, y: 969 },  // Same as I
    'K': { x: 847, y: 969 },   // K/L pair - bottom-left
    'L': { x: 847, y: 969 }    // Same as K
  }

  // CS station positions (from your diagonal rectangles)
  const csPositions = {
    'CS1': { x: 200, y: 1300 },
    'CS2': { x: 200, y: 300 }
  }

  // Net center position
  const netCenter = { x: 1620, y: 794 }

  // Parse auto path to get movement sequence
  const parsePathSequence = (path) => {
    if (!path || path.length === 0) return []
    
    const positionOrders = [netCenter] // Start from net center
    let cleanPath = path.replace(/LEAVE\s?/g, '')
    
    let i = 0
    while (i < cleanPath.length) {
      // Check for CS stations first
      if (cleanPath[i] === 'C' && i + 1 < cleanPath.length && cleanPath[i + 1] === 'S' && 
          i + 2 < cleanPath.length && (cleanPath[i + 2] === '1' || cleanPath[i + 2] === '2')) {
        const csStation = 'CS' + cleanPath[i + 2]
        positionOrders.push(csPositions[csStation])
        i += 3
      }
      // Check for position + level + optional miss
      else if (cleanPath[i] >= 'A' && cleanPath[i] <= 'L' && i + 1 < cleanPath.length && cleanPath[i + 1] >= '1' && cleanPath[i + 1] <= '4') {
        const pos = cleanPath[i]
        const missed = i + 2 < cleanPath.length && cleanPath[i + 2] === 'M'
        
        if (positions[pos]) {
          positionOrders.push(positions[pos])
        }
        
        i += missed ? 3 : 2
      }
      // Check for Net scoring
      else if (cleanPath[i] === 'N') {
        const missed = i + 1 < cleanPath.length && cleanPath[i + 1] === 'M'
        positionOrders.push(netCenter)
        i += missed ? 2 : 1
      }
      // Skip processor since it's not used in auto
      else if (cleanPath[i] === 'P') {
        const missed = i + 1 < cleanPath.length && cleanPath[i + 1] === 'M'
        i += missed ? 2 : 1
      }
      // Skip Q stations for now
      else if (cleanPath[i] === 'Q' && i + 1 < cleanPath.length && cleanPath[i + 1] >= '1' && cleanPath[i + 1] <= '3') {
        i += 2
      }
      // Skip random S letters (not part of CS)
      else if (cleanPath[i] === 'S') {
        i++
      }
      else {
        i++
      }
    }
    
    return positionOrders
  }

  const positionOrders = parsePathSequence(autoPath)

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: backgroundColor,
      borderRadius: '8px',
      border: `2px solid #4a4a4a`,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    }}>
      <h3 style={{ 
        textAlign: 'center', 
        color: '#e0e0e0',
        marginBottom: '1rem',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        Auto Path Visualization
      </h3>
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <svg width="800" height="500" viewBox="0 0 1733 1589" style={{ 
          border: '1px solid #4a4a4a',
          borderRadius: '4px'
        }}>
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={allianceColor}
              />
            </marker>
          </defs>

          {/* Your exact SVG - nothing moved */}
          <rect width="1733" height="1588" fill="#343434"/>
          <path d="M967 426L1257.12 593.5V928.5L967 1096L676.882 928.5V593.5L967 426Z" fill="#D9D9D9"/>
          <circle cx="345" cy="761" r="65" fill="#06D265"/>
          <circle cx="345" cy="1139" r="65" fill="#06D265"/>
          <circle cx="345" cy="384" r="65" fill="#06D265"/>
          <rect x="1507" width="226" height="1588" fill="#D9D9D9"/>
          <rect y="258.109" width="450" height="72" transform="rotate(-35 0 258.109)" fill="#D9D9D9"/>
          <rect width="450" height="72" transform="matrix(0.819152 0.573576 0.573576 -0.819152 0 1329.98)" fill="#D9D9D9"/>
          <circle cx="1207" cy="761" r="50" fill="#777777"/>
          <circle cx="1087" cy="553" r="50" fill="#777777"/>
          <circle cx="847" cy="969" r="50" fill="#777777"/>
          <circle cx="1087" cy="969" r="50" fill="#777777"/>
          <circle cx="847" cy="553" r="50" fill="#777777"/>
          <circle cx="727" cy="761" r="50" fill="#777777"/>

          {/* Position labels - clockwise starting from left */}
          <text x="727" y="771" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">1</text>
          <text x="847" y="563" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">2</text>
          <text x="1087" y="563" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">3</text>
          <text x="1207" y="771" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">4</text>
          <text x="1087" y="979" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">5</text>
          <text x="847" y="979" textAnchor="middle" fontSize="24" fontWeight="bold" fill="white">6</text>

          {/* Draw arrows from position to position */}
          {positionOrders.map((position, index) => {
            if (index === 0) return null // Skip first position (no arrow to draw)
            
            const prevPosition = positionOrders[index - 1]
            const totalArrows = positionOrders.length - 1 // Total number of arrows
            
            // Color interpolation from green (early) to red (later)
            let arrowColor
            if (totalArrows === 1) {
              arrowColor = '#00ff00' // Single arrow is green
            } else {
              const progress = (index - 1) / (totalArrows - 1) // 0 to 1
              const red = Math.round(255 * progress)
              const green = Math.round(255 * (1 - progress))
              arrowColor = `rgb(${red}, ${green}, 0)`
            }
            
            return (
              <line
                key={`arrow-${index}`}
                x1={prevPosition.x}
                y1={prevPosition.y}
                x2={position.x}
                y2={position.y}
                stroke={arrowColor}
                strokeWidth="15"
                markerEnd="url(#arrowhead)"
                opacity="0.9"
              />
            )
          })}

          {/* Start marker at net center */}
          {positionOrders.length > 0 && (
            <text
              x={netCenter.x}
              y={netCenter.y + 8}
              textAnchor="middle"
              fontSize="20"
              fontWeight="bold"
              fill="white"
            >
              START
            </text>
          )}
        </svg>
      </div>
      
      <div style={{ 
        marginTop: '1rem', 
        textAlign: 'center',
        color: '#e0e0e0',
        fontSize: '1rem'
      }}>
        <strong style={{ color: allianceColor }}>Auto Path:</strong> {autoPath || 'No path data'}
      </div>
    </div>
  )
}

FieldVisualization.propTypes = {
  autoPath: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired
}

export default FieldVisualization