console.log('ApplyAI Content Script Loaded.');

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getJobDetails') {
    const details = scrapeJobDetails();
    sendResponse(details);
  } else if (request.action === 'autofillForm') {
    const result = autofillPageForm(request.data);
    sendResponse(result);
  }
  return true;
});

function scrapeJobDetails() {
  const url = window.location.href;
  let title = '';
  let company = '';
  let location = '';
  let description = '';

  try {
    if (url.includes('linkedin.com')) {
      // Title
      title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.innerText || 
              document.querySelector('.jobs-unified-top-card__content--title')?.innerText ||
              document.querySelector('.jobs-details__main-content h1')?.innerText || '';
      
      // Company
      company = document.querySelector('.job-details-jobs-unified-top-card__company-name a')?.innerText || 
                document.querySelector('.jobs-unified-top-card__company-name')?.innerText ||
                document.querySelector('.jobs-details__main-content [class*="company"]')?.innerText || '';

      // Location
      location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.innerText || 
                 document.querySelector('.jobs-unified-top-card__bullet')?.innerText || '';

      // Description
      description = document.querySelector('.jobs-description__content')?.innerText || 
                    document.querySelector('#job-details')?.innerText || '';
      
    } else if (url.includes('indeed.com')) {
      title = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.innerText || '';
      company = document.querySelector('[data-company-name="true"]')?.innerText || 
                document.querySelector('.jobsearch-JobInfoHeader-companyName')?.innerText || '';
      location = document.querySelector('.jobsearch-JobInfoHeader-companyLocation')?.innerText || '';
      description = document.querySelector('#jobDescriptionText')?.innerText || '';

    } else if (url.includes('naukri.com')) {
      title = document.querySelector('.jd-header-title')?.innerText || '';
      company = document.querySelector('.jd-header-comp-name a')?.innerText || '';
      location = document.querySelector('.jd-header-comp-location')?.innerText || '';
      description = document.querySelector('.job-desc')?.innerText || '';

    } else if (url.includes('greenhouse.io')) {
      title = document.querySelector('.app-title')?.innerText || '';
      company = document.querySelector('.company-name')?.innerText || '';
      description = document.querySelector('#content')?.innerText || '';

    } else if (url.includes('lever.co')) {
      title = document.querySelector('.posting-header h2')?.innerText || '';
      company = document.querySelector('.posting-header .categories')?.innerText || '';
      description = document.querySelector('.section.page-centered')?.innerText || '';
    }

    // Generic fallback if specific selectors fail
    if (!title) {
      title = document.querySelector('h1')?.innerText || 
              document.querySelector('.job-title')?.innerText ||
              document.title || 
              'Job Opportunity';
    }

    if (!company) {
      // Try site name meta tags
      company = document.querySelector('meta[property="og:site_name"]')?.content ||
                document.querySelector('meta[name="application-name"]')?.content || '';
      
      if (!company) {
        // Guess from URL domain
        try {
          const host = window.location.hostname;
          const cleanHost = host.replace('www.', '');
          const parts = cleanHost.split('.');
          if (parts.length > 0 && parts[0] !== 'localhost') {
            company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          } else {
            company = 'Hiring Company';
          }
        } catch {
          company = 'Hiring Company';
        }
      }
    }

    if (!description) {
      // Try body or main text container
      const main = document.querySelector('main') || document.querySelector('#content') || document.body;
      description = main.innerText || document.body.innerText || 'Job description details.';
    }

  } catch (err) {
    console.error('Error scraping job details:', err);
  }

  return {
    title: title.trim().replace(/\n/g, ' '),
    company: company.trim().replace(/\n/g, ' '),
    location: location.trim().replace(/\n/g, ' '),
    description: description.trim(),
    url
  };
}

function autofillPageForm(data) {
  const { profile, coverLetter } = data;
  let filledCount = 0;

  try {
    const nameInputs = document.querySelectorAll('input[name*="name" i], input[id*="name" i], input[placeholder*="name" i]');
    const emailInputs = document.querySelectorAll('input[name*="email" i], input[id*="email" i], input[placeholder*="email" i], input[type="email"]');
    const phoneInputs = document.querySelectorAll('input[name*="phone" i], input[id*="phone" i], input[placeholder*="phone" i], input[type="tel"]');
    const locationInputs = document.querySelectorAll('input[name*="location" i], input[name*="city" i], input[id*="location" i]');
    
    // Autofill Name
    if (profile.name) {
      nameInputs.forEach(input => {
        input.value = profile.name;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        filledCount++;
      });
    }

    // Autofill Email
    if (profile.email) {
      emailInputs.forEach(input => {
        input.value = profile.email;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        filledCount++;
      });
    }

    // Autofill Phone
    if (profile.phone) {
      phoneInputs.forEach(input => {
        input.value = profile.phone;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        filledCount++;
      });
    }

    // Autofill Location
    if (profile.location) {
      locationInputs.forEach(input => {
        input.value = profile.location;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        filledCount++;
      });
    }

    // Autofill Cover Letter Textarea
    if (coverLetter) {
      const coverLetterTextareas = document.querySelectorAll('textarea[name*="cover" i], textarea[id*="cover" i], textarea[placeholder*="cover" i], textarea[placeholder*="letter" i]');
      coverLetterTextareas.forEach(textarea => {
        textarea.value = coverLetter;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        filledCount++;
      });
    }

    // Visual feedback for autofill targets
    const allInputs = [...nameInputs, ...emailInputs, ...phoneInputs, ...locationInputs];
    allInputs.forEach(input => {
      input.style.border = '2px solid #06b6d4'; // Cyan highlight
      input.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
    });

  } catch (err) {
    console.error('Error executing autofill:', err);
  }

  return { success: true, filledFields: filledCount };
}
