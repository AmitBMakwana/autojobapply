const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const PDFDocument = require('pdfkit');

/**
 * Generate formatted DOCX file for tailored resume
 */
async function generateResumeDocx(data, profile, outputPath) {
  const children = [];

  // Title / Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: profile.name || 'Your Name',
          bold: true,
          size: 32,
          font: 'Arial',
        }),
      ],
    })
  );

  // Subtitle / Contact Info
  const contactText = `${profile.email || ''}  |  ${profile.phone || ''}  |  ${profile.location || ''}`;
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: contactText,
          size: 20,
          font: 'Arial',
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' })); // Spacer

  // Summary Heading
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'PROFESSIONAL SUMMARY',
          bold: true,
          size: 24,
          font: 'Arial',
        }),
      ],
    })
  );
  
  // Summary Content
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.summary,
          size: 22,
          font: 'Arial',
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Skills Heading
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'SKILLS',
          bold: true,
          size: 24,
          font: 'Arial',
        }),
      ],
    })
  );

  // Skills List
  const skillsArray = Array.isArray(data.skills) ? data.skills : (profile.skills ? JSON.parse(profile.skills) : []);
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: skillsArray.join(', '),
          size: 22,
          font: 'Arial',
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Work History Heading
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'PROFESSIONAL EXPERIENCE',
          bold: true,
          size: 24,
          font: 'Arial',
        }),
      ],
    })
  );

  // Work History Items
  const workHistory = Array.isArray(data.workHistory) ? data.workHistory : [];
  for (const job of workHistory) {
    // Company, Title & Dates
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${job.title} - ${job.company}`,
            bold: true,
            size: 22,
            font: 'Arial',
          }),
          new TextRun({
            text: ` (${job.dates})`,
            italics: true,
            size: 20,
            font: 'Arial',
          }),
        ],
      })
    );

    // Bullet points
    if (Array.isArray(job.bullets)) {
      for (const bullet of job.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: bullet,
                size: 22,
                font: 'Arial',
              }),
            ],
          })
        );
      }
    }
    children.push(new Paragraph({ text: '' }));
  }

  // Education Heading
  const education = profile.education ? (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
  if (education.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: 'EDUCATION',
            bold: true,
            size: 24,
            font: 'Arial',
          }),
        ],
      })
    );

    for (const edu of education) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${edu.degree || 'Degree'} - ${edu.school || 'School'}`,
              bold: true,
              size: 22,
              font: 'Arial',
            }),
            new TextRun({
              text: edu.year ? ` (${edu.year})` : '',
              italics: true,
              size: 20,
              font: 'Arial',
            }),
          ],
        })
      );
    }
  }

  // Pack the document
  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * Generate formatted PDF file for tailored resume using pdfkit
 */
async function generateResumePdf(data, profile, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Name (Title)
      doc.fontSize(20).font('Helvetica-Bold').text(profile.name || 'Your Name', { align: 'center' });
      
      // Subtitle / Contact Info
      const contactText = `${profile.email || ''}  |  ${profile.phone || ''}  |  ${profile.location || ''}`;
      doc.fontSize(10).font('Helvetica').text(contactText, { align: 'center' });
      doc.moveDown(1.5);

      // Divider line
      doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(1.5);

      // Section: Summary
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('PROFESSIONAL SUMMARY');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#555').text(data.summary, { align: 'justify' });
      doc.moveDown(1.5);

      // Section: Skills
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('SKILLS');
      doc.moveDown(0.5);
      const skillsArray = Array.isArray(data.skills) ? data.skills : (profile.skills ? JSON.parse(profile.skills) : []);
      doc.fontSize(10).font('Helvetica').fillColor('#555').text(skillsArray.join(', '));
      doc.moveDown(1.5);

      // Section: Experience
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('PROFESSIONAL EXPERIENCE');
      doc.moveDown(0.5);

      const workHistory = Array.isArray(data.workHistory) ? data.workHistory : [];
      for (const job of workHistory) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(`${job.title} - ${job.company}`, { continued: true });
        doc.font('Helvetica-Oblique').fillColor('#777').text(`  (${job.dates || ''})`, { align: 'right' });
        doc.moveDown(0.2);

        if (Array.isArray(job.bullets)) {
          for (const bullet of job.bullets) {
            doc.fontSize(9.5).font('Helvetica').fillColor('#555').text(`•  ${bullet}`, {
              indent: 15,
              align: 'justify'
            });
            doc.moveDown(0.1);
          }
        }
        doc.moveDown(0.8);
      }

      // Section: Education
      const education = profile.education ? (typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education) : [];
      if (education.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333').text('EDUCATION');
        doc.moveDown(0.5);

        for (const edu of education) {
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(`${edu.degree || 'Degree'} - ${edu.school || 'School'}`, { continued: true });
          doc.font('Helvetica-Oblique').fillColor('#777').text(edu.year ? `  (${edu.year})` : '', { align: 'right' });
          doc.moveDown(0.4);
        }
      }

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate formatted DOCX file for cover letter
 */
async function generateCoverLetterDocx(coverLetterText, job, profile, outputPath) {
  const children = [];

  // Header info
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: profile.name || 'Your Name', bold: true, size: 24, font: 'Arial' }),
      ],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${profile.email || ''} | ${profile.phone || ''}`, size: 18, font: 'Arial' }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Date and Recipient info
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), size: 22, font: 'Arial' }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Hiring Team', bold: true, size: 22, font: 'Arial' }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: job.company || 'Target Company', size: 22, font: 'Arial' }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Subject line
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Subject: Application for ${job.title} Position`, bold: true, size: 22, font: 'Arial' }),
      ],
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Cover letter body (split by newlines to form paragraphs)
  const paragraphs = coverLetterText.split('\n').filter(p => p.trim());
  for (const para of paragraphs) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: para, size: 22, font: 'Arial' }),
        ],
      })
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Pack the document
  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * Generate formatted PDF file for cover letter using pdfkit
 */
async function generateCoverLetterPdf(coverLetterText, job, profile, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 60 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Candidate details (Top Right)
      doc.fontSize(12).font('Helvetica-Bold').text(profile.name || 'Your Name', { align: 'right' });
      doc.fontSize(9).font('Helvetica').fillColor('#555').text(`${profile.email || ''}  |  ${profile.phone || ''}`, { align: 'right' });
      doc.moveDown(2);

      // Date & Recipient Details (Left)
      doc.fontSize(10).font('Helvetica').fillColor('#333').text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      doc.moveDown(1);
      doc.font('Helvetica-Bold').text('Hiring Team');
      doc.font('Helvetica').text(job.company || 'Target Company');
      doc.moveDown(1.5);

      // Subject Line
      doc.font('Helvetica-Bold').text(`Subject: Application for ${job.title} Position`);
      doc.moveDown(1.5);

      // Cover letter body
      const paragraphs = coverLetterText.split('\n').filter(p => p.trim());
      for (const para of paragraphs) {
        doc.font('Helvetica').fillColor('#444').fontSize(10).text(para, {
          align: 'justify',
          lineGap: 4
        });
        doc.moveDown(1.2);
      }

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateResumeDocx,
  generateResumePdf,
  generateCoverLetterDocx,
  generateCoverLetterPdf
};
