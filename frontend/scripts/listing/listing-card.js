/**
 * common-listing-card.js - Shared listing card rendering.
 */

function renderCard(room, onClick) {
  const amenityHtml = (room.amenities || [])
    .slice(0, 3)
    .map((amenity) => `<span class="amenity-tag">${escapeHtml(amenity)}</span>`)
    .join('');
  const imageHtml = room.imageUrl
    ? `<div class="card-img" style="background-image:url('${escapeAttribute(room.imageUrl)}');background-size:cover;background-position:center;font-size:0"></div>`
    : '<div class="card-img">Room</div>';

  const card = document.createElement('div');
  card.className = 'room-card';
  card.style.cursor = 'pointer';
  if (typeof onClick === 'function') {
    card.addEventListener('click', onClick);
  } else if (onClick) {
    card.setAttribute('onclick', onClick);
  }
  card.innerHTML = `
    ${imageHtml}
    <div class="card-body">
      <div class="card-top">
        <span class="badge ${getBadgeClass(room.type)}">${room.type}</span>
        <span class="card-location"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>${escapeHtml(room.location)}</span>
      </div>
      <h3 class="card-title">${escapeHtml(room.title)}</h3>
      <div class="amenity-tags" style="margin-bottom:10px">${amenityHtml}</div>
      <div class="card-footer">
        <div class="card-price">${formatPriceTRY(room.price)}<span>/mo</span></div>
        <div class="card-avail">${formatPostingDate(room.createdAt)}</div>
      </div>
    </div>
  `;
  return card;
}

window.renderCard = renderCard;
