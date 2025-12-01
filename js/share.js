//
// share.js
// - Footer share buttons: native share, copy link, Twitter, WhatsApp
// - Works across all pages with proper URL handling
//
(function(){
  const shareBtns = document.querySelectorAll('.share-btn');
  
  // Get the current page's full URL
  const currentUrl = window.location.href;
  
  // Determine if we're on the homepage or another page
  const isHomePage = currentUrl.endsWith('/') || 
                     currentUrl.endsWith('/index.html') || 
                     currentUrl.endsWith('/index');
  
  // Use current URL if not homepage, otherwise use base URL
  const url = isHomePage ? 
              window.location.origin + '/index.html' : 
              currentUrl;
  
  const text = 'Wypal — Make AI text plain and clean in seconds. 100% local. Try it:';

  // Twitter share button
  const x = document.getElementById('shareX');
  if (x) {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    x.href = shareUrl;
  }

  // WhatsApp share button
  const wa = document.getElementById('shareWhatsApp');
  if (wa) {
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    wa.href = shareUrl;
  }

  // Handle share buttons
  shareBtns.forEach(btn => {
    const kind = btn.getAttribute('data-share');
    
    if (kind === 'native') {
      btn.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({ 
              title: 'Wypal', 
              text: text, 
              url: url 
            });
          } catch (err) {
            // User cancelled or share failed
            console.log('Share cancelled or failed');
          }
        } else {
          // Fallback to copy for browsers without Web Share API
          try {
            await navigator.clipboard.writeText(url);
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="ri-check-line mr-1"></i> Link Copied!';
            setTimeout(() => {
              btn.innerHTML = originalHTML;
            }, 1500);
          } catch (err) {
            console.error('Copy failed:', err);
          }
        }
      });
    }
    
    if (kind === 'copy') {
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(url);
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="ri-check-line mr-1"></i> Copied!';
          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 1500);
        } catch (err) {
          console.error('Copy failed:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            btn.innerHTML = '<i class="ri-check-line mr-1"></i> Copied!';
            setTimeout(() => {
              btn.innerHTML = '<i class="ri-link-m mr-1"></i> Copy Link';
            }, 1500);
          } catch (err2) {
            console.error('Fallback copy failed:', err2);
          }
          document.body.removeChild(textArea);
        }
      });
    }
  });
})();