# 🏃‍♂️ FitnessTrackerUTP

## 📱 Funcionalidades principales

- Solicita permisos de ubicación al iniciar.
- Muestra la ubicación actual del usuario en un mapa de Google.
- Lee valores del acelerómetro en tiempo real (x, y, z).
- Calcula la distancia recorrida usando coordenadas GPS.
- Estima pasos según variaciones del acelerómetro.
- Muestra velocidad promedio en km/h.
- Dibuja la ruta recorrida con una línea morada (`Polyline`).
- Guarda y recupera la última ubicación con `AsyncStorage`.
- Botón para reiniciar métricas.

---

## 🧪 Capturas de pantalla


### ✅ Permiso de ubicación solicitado

<div align="center">
   <img width="720" height="1600" alt="image" src="https://github.com/user-attachments/assets/71f89423-4e1d-48bc-91f9-21da82099fd0" />
</div>


> Al iniciar la app, se solicita permiso para acceder a la ubicación del dispositivo.


### 🗺️ Mapa con ubicación y ruta

<div align="center">
    <img width="720" height="1600" alt="image" src="https://github.com/user-attachments/assets/90d0e773-7f32-4096-b146-76a8b0349ef0" />
</div>

> Se muestra la ubicación actual con un marcador y la ruta recorrida en tiempo real.

---

## 🧠 Lógica 

### 📍 Permisos y ubicación
```
let { status } = await Location.requestForegroundPermissionsAsync();
let current = await Location.getCurrentPositionAsync({});
```

### 📦 Guardar y recuperar ubicación
```
await AsyncStorage.setItem('lastLocation', JSON.stringify(current.coords));
const saved = await AsyncStorage.getItem('lastLocation');
```

### 🛣️ Cálculo de distancia 
```
const getDistance = (c1, c2) => {
  const R = 6371e3;
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(c1.latitude * Math.PI / 180) *
    Math.cos(c2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000;
};
```


