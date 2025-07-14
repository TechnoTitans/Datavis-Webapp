import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { canEditDatabase } from '../utils/permissions'
import QrScanner from 'qr-scanner'

function Upload() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [message, setMessage] = useState('')
  const [unconfirmedData, setUnconfirmedData] = useState([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const videoRef = useRef(null)
  const qrScannerRef = useRef(null)

  useEffect(() => {
    setIsAuthenticated(canEditDatabase())
    
    const checkPermissions = () => {
      setIsAuthenticated(canEditDatabase())
    }
    
    window.addEventListener('storage', checkPermissions)
    return () => window.removeEventListener('storage', checkPermissions)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnconfirmedData()
    }
  }, [isAuthenticated])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  const fetchUnconfirmedData = async () => {
    try {
      const { data, error } = await supabase
        .from('unconfirmed_data')
        .select('*')

      if (error) {
        console.error('Error fetching unconfirmed data:', error)
        console.error('Error code:', error.code)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }
      
      console.log('Fetched unconfirmed data:', data)
      console.log('Number of records:', data?.length || 0)
      console.log('=== FETCH SUCCESS ===')
      setUnconfirmedData(data || [])
    } catch (error) {
      console.error('Error fetching unconfirmed data:', error)
      setMessage(`Error fetching data: ${error.message}`)
    }
  }

  const startScanning = async () => {
    try {
      setIsScanning(true)
      setMessage('Starting QR scanner...')
      
      if (videoRef.current) {
        // Create QR scanner instance
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log('QR Code detected:', result.data)
            setScanResult(result.data)
            parseQRData(result.data)
            stopScanning()
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        )
        
        // Start scanning
        await qrScannerRef.current.start()
        setMessage('QR scanner active. Point camera at QR code.')
        console.log('QR scanner started successfully')
      }
      
    } catch (error) {
      console.error('Error starting QR scanner:', error)
      setMessage('Error starting QR scanner: ' + error.message + ' - You can use manual input below.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    setIsScanning(false)
    
    // Stop QR scanner
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
      qrScannerRef.current.destroy()
      qrScannerRef.current = null
    }
    
    setMessage('')
  }

  const handleManualInput = () => {
    if (manualInput.trim()) {
      setScanResult(manualInput.trim())
      parseQRData(manualInput.trim())
      setManualInput('')
    }
  }

  const parseQRData = (qrText) => {
    try {
      const lines = qrText.split('\n').filter(line => line.trim() !== '')
      
      if (lines.length < 26 || lines[0] !== 'GACMP') {
        throw new Error('Invalid QR code format')
      }

      const data = {
        'Scouting ID': `${lines[0]}_${lines[1]}_${lines[2]}`,
        'Scouter Name': lines[3],
        'Position': lines[4],
        'Auto Path': lines[5] === 'null' ? null : lines[5],
        'L4 Count': parseInt(lines[6]),
        'L4 Missed Count': parseInt(lines[7]),
        'L3 Count': parseInt(lines[8]),
        'L3 Missed Count': parseInt(lines[9]),
        'L2 Count': parseInt(lines[10]),
        'L2 Missed Count': parseInt(lines[11]),
        'L1 Count': parseInt(lines[12]),
        'L1 Missed Count': parseInt(lines[13]),
        'Processor Count': parseInt(lines[14]),
        'Processor Missed Count': parseInt(lines[15]),
        'Net Count': parseInt(lines[16]),
        'Net Missed Count': parseInt(lines[17]),
        'Endgame Position': lines[18],
        'Is Ground Coral?': lines[19] === 'true',
        'Is Ground Algae?': lines[20] === 'true',
        'Driver Quality': parseInt(lines[21]),
        'Defense Ability': parseInt(lines[22]),
        'Mechanical Reliability': parseInt(lines[23]),
        'Algae Descorability': parseInt(lines[24]),
        'Notes': lines[25],
        'Use Data': true,
        _teamNumber: parseInt(lines[1]),
        _matchNumber: parseInt(lines[2])
      }

      console.log('Parsed data structure:', data)
      setParsedData(data)
      setMessage('QR code parsed successfully!')
    } catch (error) {
      console.error('Error parsing QR data:', error)
      setMessage('Error parsing QR code: ' + error.message)
      setParsedData(null)
    }
  }

  const uploadToUnconfirmed = async () => {
    if (!parsedData) {
      setMessage('No data to upload - please scan or parse QR code first')
      return
    }

    try {
      // Remove display fields before inserting
      const { _teamNumber, _matchNumber, ...dataToInsert } = parsedData
      
      const { data, error } = await supabase
        .from('unconfirmed_data')
        .insert([dataToInsert])
        .select()

      if (error) {
        throw error
      }
      
      setMessage('Data uploaded successfully to unconfirmed_data!')
      setParsedData(null)
      setScanResult('')
      
      if (isAuthenticated) {
        fetchUnconfirmedData()
      }
    } catch (error) {
      console.error('Error uploading data:', error)
      setMessage('Error uploading data: ' + error.message)
    }
  }

  const approveData = async (unconfirmedItem) => {
    try {
      await supabase
        .from('match_data')
        .delete()
        .eq('"Scouting ID"', unconfirmedItem['Scouting ID'])

      const matchData = {
        'Scouting ID': unconfirmedItem['Scouting ID'],
        'Scouter Name': unconfirmedItem['Scouter Name'],
        'Position': unconfirmedItem['Position'],
        'Auto Path': unconfirmedItem['Auto Path'],
        'L4 Count': unconfirmedItem['L4 Count'],
        'L4 Missed Count': unconfirmedItem['L4 Missed Count'],
        'L3 Count': unconfirmedItem['L3 Count'],
        'L3 Missed Count': unconfirmedItem['L3 Missed Count'],
        'L2 Count': unconfirmedItem['L2 Count'],
        'L2 Missed Count': unconfirmedItem['L2 Missed Count'],
        'L1 Count': unconfirmedItem['L1 Count'],
        'L1 Missed Count': unconfirmedItem['L1 Missed Count'],
        'Processor Count': unconfirmedItem['Processor Count'],
        'Processor Missed Count': unconfirmedItem['Processor Missed Count'],
        'Net Count': unconfirmedItem['Net Count'],
        'Net Missed Count': unconfirmedItem['Net Missed Count'],
        'Endgame Position': unconfirmedItem['Endgame Position'],
        'Is Ground Coral?': unconfirmedItem['Is Ground Coral?'],
        'Is Ground Algae?': unconfirmedItem['Is Ground Algae?'],
        'Driver Quality': unconfirmedItem['Driver Quality'],
        'Defense Ability': unconfirmedItem['Defense Ability'],
        'Mechanical Reliability': unconfirmedItem['Mechanical Reliability'],
        'Algae Descorability': unconfirmedItem['Algae Descorability'],
        'Notes': unconfirmedItem['Notes'],
        'Use Data': true
      }

      console.log('Inserting approved data into match_data:', matchData)

      const { error: insertError } = await supabase
        .from('match_data')
        .insert([matchData])

      if (insertError) {
        console.error('Error inserting into match_data:', insertError)
        throw insertError
      }

      const { error: deleteError } = await supabase
        .from('unconfirmed_data')
        .delete()
        .eq('"Scouting ID"', unconfirmedItem['Scouting ID'])

      if (deleteError) {
        console.error('Error deleting from unconfirmed_data:', deleteError)
        throw deleteError
      }

      setMessage(`Approved data for ${unconfirmedItem['Scouting ID']}`)
      fetchUnconfirmedData()
    } catch (error) {
      console.error('Error approving data:', error)
      setMessage('Error approving data: ' + error.message)
    }
  }

  const rejectData = async (unconfirmedItem) => {
    try {
      const { error } = await supabase
        .from('unconfirmed_data')
        .delete()
        .eq('"Scouting ID"', unconfirmedItem['Scouting ID'])

      if (error) throw error
      
      setMessage(`Rejected data for ${unconfirmedItem['Scouting ID']}`)
      fetchUnconfirmedData()
    } catch (error) {
      console.error('Error rejecting data:', error)
      setMessage('Error rejecting data: ' + error.message)
    }
  }

  return (
    <div className="upload-container">
      <h2>Upload</h2>
      
      {/* QR Scanner Section */}
      <div className="upload-section">
        <h3>QR Code Scanner</h3>
        
        {/* Camera Scanner */}
        <div className="camera-section">
          <div className="camera-button-wrapper">
            <button 
              onClick={isScanning ? stopScanning : startScanning}
              className={`camera-button ${isScanning ? 'stop' : 'start'}`}
            >
              {isScanning ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          {isScanning && (
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />
              <p className="video-instruction">
                <strong>Point the QR code at the camera - it will scan automatically!</strong>
              </p>
            </div>
          )}
        </div>

        {/* Manual Input */}
        <div className="manual-input-section">
          <h4>Manual QR Data Input</h4>
          <p className="manual-input-description">
            Paste or type the QR code content here:
          </p>
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="manual-input-textarea"
          />
          <button 
            onClick={handleManualInput}
            disabled={!manualInput.trim()}
            className={`parse-button ${manualInput.trim() ? 'enabled' : 'disabled'}`}
          >
            Parse QR Data
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {parsedData && (
          <div className="parsed-data-container">
            <h4>Parsed QR Data:</h4>
            <p><strong>Team:</strong> {parsedData._teamNumber}</p>
            <p><strong>Match:</strong> {parsedData._matchNumber}</p>
            <p><strong>Scouter:</strong> {parsedData['Scouter Name']}</p>
            <p><strong>Position:</strong> {parsedData['Position']}</p>
            <p><strong>Scouting ID:</strong> {parsedData['Scouting ID']}</p>
            
            <button 
              onClick={uploadToUnconfirmed}
              className="upload-button"
            >
              Upload to Unconfirmed Data
            </button>
            
            <p className="upload-note">
              Anyone can upload data - it will be reviewed before being approved.
            </p>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <div>
          <h3>Unconfirmed Data Management</h3>
          <p>Review and approve scanned data below:</p>
          
          {unconfirmedData.length === 0 ? (
            <p>No unconfirmed data found.</p>
          ) : (
            <div className="unconfirmed-data-container">
              {unconfirmedData.map((item) => (
                <div 
                  key={item['Scouting ID']} 
                  className="unconfirmed-item"
                >
                  <h4>{item['Scouting ID']}</h4>
                  <p><strong>Team:</strong> {item['Scouting ID']?.split('_')[1]} | <strong>Match:</strong> {item['Scouting ID']?.split('_')[2]}</p>
                  <p><strong>Scouter:</strong> {item['Scouter Name']} | <strong>Position:</strong> {item['Position']}</p>
                  <p><strong>Notes:</strong> {item['Notes']}</p>
                  
                  <div className="unconfirmed-item-actions">
                    <button 
                      onClick={() => approveData(item)}
                      className="approve-button"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => rejectData(item)}
                      className="reject-button"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="info-panel blue">
          <h3>Upload Complete!</h3>
          <p><strong>Anyone can scan and upload QR codes.</strong></p>
          <p>Your scanned data has been uploaded to the unconfirmed data queue.</p>
          <p>Team admins will review and approve the data before it appears in the main dataset.</p>
          <p className="info-panel-subtitle">
            <em>Note: Enable database editing permissions in Settings to manage unconfirmed data.</em>
          </p>
        </div>
      )}
    </div>
  )
}

export default Upload