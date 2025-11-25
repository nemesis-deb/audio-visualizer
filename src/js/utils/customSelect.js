/**
 * Custom Select Utility
 * Creates a styled custom dropdown to replace native select elements
 */
export function createCustomSelect(selectElement) {
  // Check if custom select already exists
  if (selectElement.nextElementSibling?.classList.contains('custom-select')) {
    return; // Already has a custom select, don't create another one
  }
  
  // Create custom select wrapper
  const customSelect = document.createElement('div');
  customSelect.className = 'custom-select';

  // Check if this select should open upwards
  if (selectElement.classList.contains('dropdown-up')) {
    customSelect.classList.add('dropdown-up');
  }

  // Create trigger
  const trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger';
  trigger.textContent = selectElement.options[selectElement.selectedIndex]?.text || selectElement.value;

  // Create options container
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'custom-select-options';

  // Populate options
  Array.from(selectElement.options).forEach((option, index) => {
    const customOption = document.createElement('div');
    customOption.className = 'custom-select-option';
    customOption.textContent = option.text;
    customOption.dataset.value = option.value;

    if (option.selected) {
      customOption.classList.add('selected');
    }

    // Click handler
    customOption.addEventListener('click', () => {
      // Update native select
      selectElement.selectedIndex = index;
      selectElement.dispatchEvent(new Event('change'));

      // Update trigger
      trigger.textContent = option.text;

      // Update selected class
      optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      customOption.classList.add('selected');

      // Close dropdown
      customSelect.classList.remove('open');
    });

    optionsContainer.appendChild(customOption);
  });

  // Toggle dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    customSelect.classList.toggle('open');
  });

  // Close on outside click
  const closeHandler = (e) => {
    if (!customSelect.contains(e.target)) {
      customSelect.classList.remove('open');
    }
  };
  document.addEventListener('click', closeHandler);

  // Assemble
  customSelect.appendChild(trigger);
  customSelect.appendChild(optionsContainer);

  // Insert after native select
  selectElement.parentNode.insertBefore(customSelect, selectElement.nextSibling);
  
  // Update trigger when native select changes
  selectElement.addEventListener('change', () => {
    trigger.textContent = selectElement.options[selectElement.selectedIndex]?.text || selectElement.value;
    // Update selected class in options
    optionsContainer.querySelectorAll('.custom-select-option').forEach((opt, idx) => {
      if (idx === selectElement.selectedIndex) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  });
}

// Export to window for global access
if (typeof window !== 'undefined') {
  window.createCustomSelect = createCustomSelect;
}

