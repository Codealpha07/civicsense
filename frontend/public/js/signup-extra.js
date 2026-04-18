// Signup form extras (show password, confirm validation, city-district)
document.addEventListener('DOMContentLoaded', () => {
  const pwd = document.getElementById('signupPassword');
  const confirmPwd = document.getElementById('confirmPassword');
  const toggle = document.getElementById('togglePwd');
  const form = document.getElementById('signupForm');
  const citySelect = document.getElementById('citySelect');
  const stateSelect = document.getElementById('stateSelect');
  // Provide CSC API Key (ideally inject securely from backend)
  const CSC_API_KEY = 'NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA==';

  // Toggle show/hide password for both fields
  if (toggle && pwd) {
    toggle.addEventListener('click', () => {
      const show = pwd.type === 'password';
      pwd.type = confirmPwd.type = show ? 'text' : 'password';
      toggle.innerHTML = show ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
  }

  // Confirm password validation
  if (form && confirmPwd) {
    form.addEventListener('submit', (e) => {
      if (pwd.value !== confirmPwd.value) {
        e.preventDefault();
        alert('Passwords do not match');
        confirmPwd.focus();
      }
    });
  }

  // Dynamic State -> City using CountryStateCity API
  if (stateSelect && citySelect) {
    fetch('https://api.countrystatecity.in/v1/countries/IN/states', {
      headers: { 'X-CSCAPI-KEY': CSC_API_KEY }
    })
      .then(res => res.json())
      .then(states => {
        // populate states dropdown
        // sort states alphabetically by name
        states.sort((a, b) => a.name.localeCompare(b.name));
        states.forEach(st => {
          const opt = document.createElement('option');
          opt.value = st.name;  // Store state name instead of ISO code
          opt.dataset.iso2 = st.iso2;  // Keep ISO code in dataset for API calls
          opt.textContent = st.name;
          stateSelect.appendChild(opt);
        });

        stateSelect.addEventListener('change', () => {
          citySelect.innerHTML = '<option selected disabled>Select City</option>';
          const selectedOption = stateSelect.options[stateSelect.selectedIndex];
          const stateCode = selectedOption.dataset.iso2;
          if (!stateCode) return;
          fetch(`https://api.countrystatecity.in/v1/countries/IN/states/${stateCode}/cities`, {
            headers: { 'X-CSCAPI-KEY': CSC_API_KEY }
          })
            .then(res => res.json())
            .then(cities => {
              // sort cities alphabetically
              cities.sort((a, b) => a.name.localeCompare(b.name));
              cities.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;  // Store city name
                opt.textContent = c.name;
                citySelect.appendChild(opt);
              });
            })
            .catch(err => console.error('City data error', err));
        });

        
      })
      .catch(err => console.error('Location data load error', err));
    }
});
