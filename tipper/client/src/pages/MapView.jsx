import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, AppBar, Spinner } from '../components/Layout.jsx';
import { Mission } from '../components/AdCard.jsx';
import { api } from '../api.js';
import { useApp } from '../context/AppContext.jsx';
import { chf } from '../constants.js';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const s = document.createElement('script');
    s.src = LEAFLET_JS;
    s.onload = () => resolve(window.L);
    s.onerror = () => reject(new Error('map'));
    document.head.appendChild(s);
  });
}

export function MapView() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [ads, setAds] = useState(null);
  const [failed, setFailed] = useState(false);
  const mapRef = useRef(null);
  const elRef = useRef(null);

  useEffect(() => { api.listAds({ sort: 'distance' }).then((d) => setAds(d.ads.filter((a) => !a.is_mine && a.lat != null))); }, []);

  useEffect(() => {
    if (!ads || failed || !elRef.current) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || mapRef.current) return;
      const center = user.lat != null ? [user.lat, user.lng] : (ads[0] ? [ads[0].lat, ads[0].lng] : [46.2044, 6.1432]);
      const map = L.map(elRef.current, { zoomControl: false }).setView(center, 13);
      mapRef.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap, © CARTO', maxZoom: 19,
      }).addTo(map);
      if (user.lat != null) {
        L.circleMarker([user.lat, user.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#6C8CFF', fillOpacity: 1 }).addTo(map);
      }
      ads.forEach((a) => {
        const icon = L.divIcon({ className: '', html: `<div class="leaflet-pin">${chf(a.tip_amount)}</div>`, iconAnchor: [10, 30] });
        L.marker([a.lat, a.lng], { icon }).addTo(map).on('click', () => navigate(`/ads/${a.id}`));
      });
    }).catch(() => setFailed(true));
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [ads, failed, user, navigate]);

  return (
    <Screen>
      <AppBar title="Carte des missions" back="/explore" subtitle={ads ? `${ads.length} autour de vous` : '…'} />
      <div className="content">
        {!ads ? <Spinner /> : failed ? (
          <>
            <div className="card center muted" style={{ padding: 20 }}>🗺️ Carte indisponible hors-ligne — voici la liste :</div>
            {ads.map((a) => <Mission key={a.id} ad={a} />)}
          </>
        ) : (
          <>
            <div className="map-wrap"><div id="leafmap" ref={elRef} /></div>
            <div className="sub center" style={{ margin: '14px 0' }}>Touchez un repère 💰 pour ouvrir la mission</div>
            {ads.slice(0, 3).map((a) => <Mission key={a.id} ad={a} />)}
          </>
        )}
      </div>
    </Screen>
  );
}
