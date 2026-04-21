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

  // Indian States & UTs Fallback Data
  const fallbackStates = [
    { iso2: "AN", name: "Andaman and Nicobar Islands" },
    { iso2: "AP", name: "Andhra Pradesh" },
    { iso2: "AR", name: "Arunachal Pradesh" },
    { iso2: "AS", name: "Assam" },
    { iso2: "BR", name: "Bihar" },
    { iso2: "CH", name: "Chandigarh" },
    { iso2: "CT", name: "Chhattisgarh" },
    { iso2: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
    { iso2: "DL", name: "Delhi" },
    { iso2: "GA", name: "Goa" },
    { iso2: "GJ", name: "Gujarat" },
    { iso2: "HR", name: "Haryana" },
    { iso2: "HP", name: "Himachal Pradesh" },
    { iso2: "JK", name: "Jammu and Kashmir" },
    { iso2: "JH", name: "Jharkhand" },
    { iso2: "KA", name: "Karnataka" },
    { iso2: "KL", name: "Kerala" },
    { iso2: "LA", name: "Ladakh" },
    { iso2: "LD", name: "Lakshadweep" },
    { iso2: "MP", name: "Madhya Pradesh" },
    { iso2: "MH", name: "Maharashtra" },
    { iso2: "MN", name: "Manipur" },
    { iso2: "ML", name: "Meghalaya" },
    { iso2: "MZ", name: "Mizoram" },
    { iso2: "NL", name: "Nagaland" },
    { iso2: "OR", name: "Odisha" },
    { iso2: "PY", name: "Puducherry" },
    { iso2: "PB", name: "Punjab" },
    { iso2: "RJ", name: "Rajasthan" },
    { iso2: "SK", name: "Sikkim" },
    { iso2: "TN", name: "Tamil Nadu" },
    { iso2: "TG", name: "Telangana" },
    { iso2: "TR", name: "Tripura" },
    { iso2: "UP", name: "Uttar Pradesh" },
    { iso2: "UT", name: "Uttarakhand" },
    { iso2: "WB", name: "West Bengal" }
  ];

  function populateStates(states) {
    stateSelect.innerHTML = '<option selected disabled>Select State</option>';
    states.sort((a, b) => a.name.localeCompare(b.name));
    states.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.name;
      opt.dataset.iso2 = st.iso2;
      opt.textContent = st.name;
      stateSelect.appendChild(opt);
    });
  }

  // Dynamic State -> City using CountryStateCity API
  if (stateSelect && citySelect) {
    fetch('https://api.countrystatecity.in/v1/countries/IN/states', {
      headers: { 'X-CSCAPI-KEY': CSC_API_KEY }
    })
      .then(res => {
        if (!res.ok) throw new Error('API Key or Service Error');
        return res.json();
      })
      .then(states => {
        if (!Array.isArray(states)) throw new Error('Invalid Data');
        populateStates(states);
      })
      .catch(err => {
        console.warn('Using fallback state data due to API error:', err);
        populateStates(fallbackStates);
      });

    stateSelect.addEventListener('change', () => {
      citySelect.innerHTML = '<option selected disabled>Loading Cities...</option>';
      const selectedOption = stateSelect.options[stateSelect.selectedIndex];
      const stateCode = selectedOption.dataset.iso2;
      
      if (!stateCode) return;

      fetch(`https://api.countrystatecity.in/v1/countries/IN/states/${stateCode}/cities`, {
        headers: { 'X-CSCAPI-KEY': CSC_API_KEY }
      })
        .then(res => res.json())
        .then(cities => {
          citySelect.innerHTML = '<option selected disabled>Select City</option>';
          if (!Array.isArray(cities) || cities.length === 0) {
            // Fallback: If no cities returned, allow manual entry or show a prompt
            const opt = document.createElement('option');
            opt.value = "Other";
            opt.textContent = "Other / Not Listed";
            citySelect.appendChild(opt);
            return;
          }
          cities.sort((a, b) => a.name.localeCompare(b.name));
          cities.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            citySelect.appendChild(opt);
          });
        })
        .catch(err => {
          console.error('City data error', err);
          citySelect.innerHTML = '<option selected disabled>Error loading cities</option>';
        });
    });
  }
});
