import PDFDocument from 'pdfkit';

export const generatePDFReport = async (url, scanResults) => {
  // Validate inputs
  if (!url || !scanResults) {
    throw new Error('URL and scan results are required');
  }

  // Ensure scanResults has the expected structure with default values
  const safeScanResults = {
    malware: scanResults.malware || { found: false, links: [] },
    phishing: scanResults.phishing || { found: false, info: 'No phishing detected' },
    openRedirects: scanResults.openRedirects || { found: false, info: 'No open redirects found' },
    cms: scanResults.cms || { vulnerable: false, cms: 'Unknown', info: 'No CMS vulnerabilities detected' },
    securityHeaders: scanResults.securityHeaders || { missing: [] },
    openPorts: scanResults.openPorts || { openPorts: [] },
    hiddenScripts: scanResults.hiddenScripts || { samples: [] },
    dnsRebinding: scanResults.dnsRebinding || { records: [] }
  };

  const doc = new PDFDocument({ margin: 40 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // Page Border
  doc.save()
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .strokeColor('#cfd8dc')
    .lineWidth(1)
    .stroke()
    .restore();

  // Header
  doc
    .fillColor('#003366')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('CyberSecure-web - Website Security Report', { align: 'center' })
    .moveDown(0.3)
    .fontSize(12)
    .fillColor('#37474f')
    .font('Helvetica')
    .text(`Scanned URL: ${url}`, { align: 'center' })
    .text(`Scan Timestamp: ${new Date().toLocaleString()}`, { align: 'center' })
    .moveDown(1);

  // Table Title
  doc
    .fontSize(16)
    .fillColor('#1a237e')
    .font('Helvetica-Bold')
    .text('Scan Summary', { underline: true, align: 'center' })
    .moveDown(0.5);

  // Table config
  const startY = doc.y;
  const colPositions = {
    vulnerability: 40,
    status: 170,
    details: 240,
    suggestion: 400
  };
  const colWidths = {
    vulnerability: 120,
    status: 60,
    details: 150,
    suggestion: 160
  };

  const rowHeightPadding = 6;
  let y = startY;

  // Table Headers
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text('Vulnerability', colPositions.vulnerability, y, { width: colWidths.vulnerability })
    .text('Status', colPositions.status, y, { width: colWidths.status })
    .text('Details', colPositions.details, y, { width: colWidths.details })
    .text('Suggestion', colPositions.suggestion, y, { width: colWidths.suggestion });

  y += 18;
  doc.moveTo(40, y).lineTo(570, y).strokeColor('#bdbdbd').lineWidth(1).stroke();
  y += 4;

  const sections = {
    malware: 'Malware Links',
    phishing: 'Phishing Pages',
    openRedirects: 'Open Redirects',
    cms: 'CMS Vulnerabilities',
    securityHeaders: 'Missing Security Headers',
    openPorts: 'Open Ports',
    hiddenScripts: 'Hidden Scripts',
    dnsRebinding: 'DNS Rebinding'
  };

  const suggestions = {
    malware: 'Use malware scanners, remove infected links.',
    phishing: 'Avoid mimicking login pages; secure forms.',
    openRedirects: 'Validate redirect URLs server-side.',
    cms: 'Update CMS and use plugins for security.',
    securityHeaders: 'Add CSP, HSTS, and X-Frame-Options headers.',
    openPorts: 'Close/secure unused ports with firewall.',
    hiddenScripts: 'Audit and clean injected scripts.',
    dnsRebinding: 'Implement DNS hardening (e.g., DNS pinning).'
  };

  let isAlternate = false;

  for (const key in sections) {
    const title = sections[key];
    const data = safeScanResults[key];
    const suggestion = suggestions[key];

    let status = 'No';
    let details = '';

    try {
      if (key === 'cms') {
        status = data?.vulnerable ? 'Yes' : 'No';
        details = `CMS: ${data?.cms || 'None'}, ${data?.info || 'No information available'}`;
      } else if (key === 'securityHeaders') {
        const missingHeaders = Array.isArray(data?.missing) ? data.missing : [];
        status = missingHeaders.length > 0 ? 'Yes' : 'No';
        details = missingHeaders.length > 0 ? missingHeaders.join(', ') : 'None missing';
      } else if (key === 'openPorts') {
        const openPorts = Array.isArray(data?.openPorts) ? data.openPorts : [];
        status = openPorts.length > 0 ? 'Yes' : 'No';
        details = openPorts.length > 0 ? openPorts.join(', ') : 'None';
      } else if (key === 'hiddenScripts') {
        const samples = Array.isArray(data?.samples) ? data.samples : [];
        status = samples.length > 0 ? 'Yes' : 'No';
        details = samples.length > 0 ? samples.slice(0, 3).join(', ') + (samples.length > 3 ? '...' : '') : 'None';
      } else if (key === 'dnsRebinding') {
        const records = Array.isArray(data?.records) ? data.records : [];
        status = records.length > 0 ? 'Yes' : 'No';
        details = records.length > 0 ? records.join(', ') : 'None';
      } else if (key === 'malware') {
        status = data?.found ? 'Yes' : 'No';
        const links = Array.isArray(data?.links) ? data.links : [];
        details = links.length > 0 ? links.slice(0, 2).join(', ') + (links.length > 2 ? '...' : '') : 'None';
      } else {
        status = data?.found ? 'Yes' : 'No';
        details = data?.info || 'No additional information';
      }
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      status = 'Error';
      details = 'Error processing data';
    }

    // Ensure details is a string and not too long
    if (typeof details !== 'string') {
      details = String(details || 'No data available');
    }
    
    // Truncate very long details
    if (details.length > 100) {
      details = details.substring(0, 97) + '...';
    }

    try {
      const detailsHeight = doc.heightOfString(details, { width: colWidths.details });
      const suggestionHeight = doc.heightOfString(suggestion, { width: colWidths.suggestion });
      const rowHeight = Math.max(detailsHeight, suggestionHeight, 14) + rowHeightPadding;

      // Check if we need a new page
      if (y + rowHeight > doc.page.height - 80) {
        doc.addPage();
        y = 40;
      }

      // Alternate row background
      if (isAlternate) {
        doc
          .rect(40, y - 2, 510, rowHeight + 2)
          .fill('#f0f4f8')
          .fillColor('black');
      }
      isAlternate = !isAlternate;

      // Write data
      doc
        .fontSize(9)
        .fillColor('black')
        .font('Helvetica')
        .text(title, colPositions.vulnerability, y, { width: colWidths.vulnerability })
        .fillColor(status === 'Yes' ? '#d32f2f' : status === 'Error' ? '#ff9800' : '#388e3c')
        .text(status, colPositions.status, y, { width: colWidths.status })
        .fillColor('black')
        .text(details, colPositions.details, y, { width: colWidths.details })
        .text(suggestion, colPositions.suggestion, y, { width: colWidths.suggestion });

      y += rowHeight;
    } catch (error) {
      console.error(`Error rendering row for ${key}:`, error);
      // Skip this row and continue
      continue;
    }
  }

  // Footer
  doc
    .moveDown(2)
    .fontSize(9)
    .fillColor('gray')
    .text('Report generated by CyberSecure-web - Open Source Security Scanner', {
      align: 'center'
    })
    .text('© 2025 CyberSecure-web Team. All rights reserved.', {
      align: 'center'
    });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      try {
        const pdfData = Buffer.concat(buffers);
        console.log('PDF report generated successfully in memory');
        resolve(pdfData);
      } catch (error) {
        console.error('Error generating PDF buffer:', error);
        reject(error);
      }
    });
    doc.on('error', (error) => {
      console.error('Error in PDF generation:', error);
      reject(error);
    });
  });
};