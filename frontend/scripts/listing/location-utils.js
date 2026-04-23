(function () {
  const locations = Array.isArray(window.TURKEY_LOCATIONS) ? window.TURKEY_LOCATIONS : [];
  const cityMap = new Map(locations.map((city) => [city.name, city]));
  const districtToCities = new Map();

  for (const city of locations) {
    for (const district of city.districts || []) {
      if (!districtToCities.has(district)) districtToCities.set(district, []);
      districtToCities.get(district).push(city.name);
    }
  }

  function sortByTurkish(valueList) {
    return [...valueList].sort((a, b) => a.localeCompare(b, 'tr'));
  }

  function formatLocationValue(city, district) {
    if (city && district) return `${district}, ${city}`;
    return city || district || '';
  }

  function parseLocationValue(value) {
    const raw = (value || '').trim();
    if (!raw) return { city: '', district: '', display: '' };

    const commaIndex = raw.lastIndexOf(',');
    if (commaIndex !== -1) {
      const district = raw.slice(0, commaIndex).trim();
      const city = raw.slice(commaIndex + 1).trim();
      if (cityMap.has(city)) {
        return { city, district, display: formatLocationValue(city, district) };
      }
    }

    if (cityMap.has(raw)) {
      return { city: raw, district: '', display: raw };
    }

    const guessedCities = districtToCities.get(raw) || [];
    if (guessedCities.length === 1) {
      return {
        city: guessedCities[0],
        district: raw,
        display: formatLocationValue(guessedCities[0], raw)
      };
    }

    return { city: '', district: raw, display: raw };
  }

  function fillSelect(select, options, placeholder, placeholderValue = '') {
    if (!select) return;
    select.innerHTML = '';
    const first = document.createElement('option');
    first.value = placeholderValue;
    first.textContent = placeholder;
    select.appendChild(first);

    options.forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });
  }

  function populateCitySelect(select, placeholder, includeAllLabel) {
    if (!select) return;
    const options = sortByTurkish(locations.map((city) => city.name));
    const firstLabel = includeAllLabel || placeholder;
    fillSelect(select, options, firstLabel, includeAllLabel || '');
  }

  function populateDistrictSelect(select, cityName, placeholder, includeAllLabel) {
    if (!select) return;
    const city = cityMap.get(cityName);
    const districts = city ? sortByTurkish(city.districts || []) : [];
    fillSelect(select, districts, includeAllLabel || placeholder, includeAllLabel || '');
    const shouldDisable = !cityName;
    select.disabled = shouldDisable;
  }

  function setCityDistrictValue(citySelect, districtSelect, locationValue, config = {}) {
    const parsed = parseLocationValue(locationValue);
    const cityPlaceholder = config.cityPlaceholder || 'Select city...';
    const districtPlaceholder = config.districtPlaceholder || 'Select district...';
    populateCitySelect(citySelect, cityPlaceholder, config.allCityLabel);
    if (parsed.city) citySelect.value = parsed.city;
    populateDistrictSelect(districtSelect, parsed.city, districtPlaceholder, config.allDistrictLabel);
    if (parsed.district && districtSelect) districtSelect.value = parsed.district;
    return parsed;
  }

  function normalizeWhatsApp(rawValue) {
    const value = (rawValue || '').trim();
    if (!value) return { valid: true, normalized: '', message: '' };

    const plainNumberPattern = /^[+\d\s()-]+$/;
    if (plainNumberPattern.test(value)) {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        return { valid: true, normalized: `https://wa.me/${digits}`, message: '' };
      }
      return { valid: false, normalized: '', message: 'Please enter a valid WhatsApp phone number.' };
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(value);
    } catch {
      return { valid: false, normalized: '', message: 'Please enter a valid WhatsApp link or phone number.' };
    }

    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'wa.me') {
      const digits = parsedUrl.pathname.replace(/\//g, '').replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        return { valid: true, normalized: `https://wa.me/${digits}`, message: '' };
      }
    }

    if (host === 'api.whatsapp.com' || host === 'whatsapp.com') {
      const digits = (parsedUrl.searchParams.get('phone') || '').replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) {
        return { valid: true, normalized: `https://wa.me/${digits}`, message: '' };
      }
    }

    return { valid: false, normalized: '', message: 'Please enter a valid WhatsApp link or phone number.' };
  }

  function normalizeMapLocationLink(rawValue) {
    const value = (rawValue || '').trim();
    if (!value) return { valid: true, normalized: '', message: '' };

    let parsedUrl;
    try {
      parsedUrl = new URL(value);
    } catch {
      return { valid: false, normalized: '', message: 'Please paste a shared Google Maps link.' };
    }

    const host = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    const looksLikeSharedGoogleMapsLink =
      host === 'maps.app.goo.gl' &&
      parsedUrl.protocol === 'https:' &&
      parsedUrl.pathname.length > 1;

    if (looksLikeSharedGoogleMapsLink) {
      return { valid: true, normalized: parsedUrl.toString(), message: '' };
    }

    return { valid: false, normalized: '', message: 'Please paste a `maps.app.goo.gl` Google Maps share link.' };
  }

  function bindWhatsAppValidation(input, errorEl) {
    if (!input || !errorEl) return;

    const validate = () => {
      const result = normalizeWhatsApp(input.value);
      const hasError = !result.valid;
      errorEl.textContent = hasError ? result.message : '';
      input.classList.toggle('input-error', hasError);
      return result;
    };

    input.addEventListener('input', validate);
    input.addEventListener('blur', validate);
    return validate;
  }

  function bindMapLocationValidation(input, errorEl) {
    if (!input || !errorEl) return;

    const validate = () => {
      const result = normalizeMapLocationLink(input.value);
      const hasError = !result.valid;
      errorEl.textContent = hasError ? result.message : '';
      input.classList.toggle('input-error', hasError);
      return result;
    };

    input.addEventListener('input', validate);
    input.addEventListener('blur', validate);
    return validate;
  }

  window.RoommieLocationUtils = {
    locations,
    formatLocationValue,
    parseLocationValue,
    populateCitySelect,
    populateDistrictSelect,
    setCityDistrictValue,
    normalizeWhatsApp,
    bindWhatsAppValidation,
    normalizeMapLocationLink,
    bindMapLocationValidation
  };
})();

