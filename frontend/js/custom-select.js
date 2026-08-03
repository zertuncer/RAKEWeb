function initCustomSelects() {
    // Cleanup any orphaned options divs from body (e.g. after table re-render)
    document.querySelectorAll('.custom-select-options').forEach(optDiv => {
        if (!optDiv.dataset.selectId || !document.getElementById(optDiv.dataset.selectId)) {
            optDiv.remove();
        }
    });

    document.querySelectorAll('select:not(.customized)').forEach(select => {
        // Ensure select has an ID for tracking
        if (!select.id) select.id = 'select-' + Math.random().toString(36).substr(2, 9);
        
        select.classList.add('customized');
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        if (select.id) wrapper.id = select.id + '-wrapper';
        
        // Match wrapper width to select's intended width behavior
        if (select.style.width === 'auto') {
            wrapper.style.display = 'inline-block';
            wrapper.style.width = 'auto';
        } else {
            wrapper.style.width = '100%';
        }
        
        // Create trigger
        const trigger = document.createElement('div');
        // Copy original classes to trigger so it matches the exact size and style!
        trigger.className = 'custom-select-trigger ' + select.className.replace('customized', '');
        // Copy inline styles to trigger
        trigger.style.cssText = select.style.cssText;
        trigger.style.display = 'flex'; // override display to keep icon aligned
        
        // Find selected text
        let selectedText = '';
        if (select.selectedIndex !== -1) {
            selectedText = select.options[select.selectedIndex].text;
        } else {
            selectedText = select.options[0] ? select.options[0].text : 'Seçiniz';
        }
        
        trigger.innerHTML = `<span>${selectedText}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:8px; flex-shrink:0;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        
        // Create options container
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'custom-select-options';
        optionsDiv.dataset.selectId = select.id;
        
        Array.from(select.options).forEach((opt, index) => {
            if (opt.disabled) return; 
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.innerText = opt.text;
            
            if (select.selectedIndex === index) {
                optionDiv.classList.add('selected');
            }
            
            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                select.selectedIndex = index;
                trigger.querySelector('span').innerText = opt.text;
                
                // Update selected class
                optionsDiv.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
                optionDiv.classList.add('selected');
                
                // Fire native change event
                select.dispatchEvent(new Event('change', { bubbles: true }));
                
                optionsDiv.classList.remove('open');
                trigger.classList.remove('open');
                
                // Sync colors for status select
                if (select.classList.contains('status-select')) {
                    trigger.className = 'custom-select-trigger ' + select.className.replace('customized', '');
                }
            });
            optionsDiv.appendChild(optionDiv);
        });
        
        wrapper.appendChild(trigger);
        // Append to body instead of wrapper to avoid overflow clipping issues
        document.body.appendChild(optionsDiv);
        
        select.parentNode.insertBefore(wrapper, select.nextSibling);
        select.style.display = 'none';
        
        // Sync original select classes with trigger
        select.addEventListener('change', () => {
            if (select.classList.contains('status-select')) {
                trigger.className = 'custom-select-trigger ' + select.className.replace('customized', '');
            }
        });
        
        // Toggle options
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = optionsDiv.classList.contains('open');
            
            // Close all others
            document.querySelectorAll('.custom-select-options').forEach(o => o.classList.remove('open'));
            document.querySelectorAll('.custom-select-trigger').forEach(t => t.classList.remove('open'));
            
            if (!isOpen) {
                // Position optionsDiv dynamically
                const rect = trigger.getBoundingClientRect();
                optionsDiv.style.top = (rect.bottom + window.scrollY + 4) + 'px';
                optionsDiv.style.left = (rect.left + window.scrollX) + 'px';
                optionsDiv.style.minWidth = rect.width + 'px';
                
                optionsDiv.classList.add('open');
                trigger.classList.add('open');
            }
        });
    });
}

// Close options when clicking outside
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-options').forEach(o => o.classList.remove('open'));
    document.querySelectorAll('.custom-select-trigger').forEach(t => t.classList.remove('open'));
});

// Close options when scrolling anywhere to prevent detached floating dropdowns
window.addEventListener('scroll', () => {
    document.querySelectorAll('.custom-select-options').forEach(o => o.classList.remove('open'));
    document.querySelectorAll('.custom-select-trigger').forEach(t => t.classList.remove('open'));
}, true);
