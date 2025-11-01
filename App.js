import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Button, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [steps, setSteps] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [history, setHistory] = useState([]);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false); 

  // Recuperar última ubicación guardada y luego obtener la actual
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        return;
      }

      const saved = await AsyncStorage.getItem('lastLocation');
      if (saved) {
        const coords = JSON.parse(saved);
        setLocation(coords);
        setLoadedFromStorage(true); 
      }

      let current = await Location.getCurrentPositionAsync({});
      setLocation(current.coords);
      await AsyncStorage.setItem('lastLocation', JSON.stringify(current.coords));
    })();
  }, []);

  // Lectura del acelerómetro y estimación de pasos
  useEffect(() => {
    let lastMagnitude = 0;
    const threshold = 1.2;

    const sub = Accelerometer.addListener(data => {
      setAccelData(data);
      const magnitude = Math.sqrt(data.x * 2 + data.y * 2 + data.z ** 2);
      if (Math.abs(magnitude - lastMagnitude) > threshold) {
        setSteps(prev => prev + 1);
      }
      lastMagnitude = magnitude;
    });

    return () => sub.remove();
  }, []);

  // Actualizar ruta, distancia, velocidad y guardar historial
  useEffect(() => {
    const interval = setInterval(async () => {
      let current = await Location.getCurrentPositionAsync({});
      const coords = current.coords;
      setSpeed(coords.speed || 0);

      setRoute(prev => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const d = getDistance(last, coords);
          setDistance(prevDist => prevDist + d);
        }
        return [...prev, coords];
      });

      const recorrido = {
        timestamp: new Date().toISOString(),
        coords,
        steps,
        distance,
      };
      setHistory(prev => {
        const updated = [...prev, recorrido];
        AsyncStorage.setItem('history', JSON.stringify(updated));
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [steps, distance]);

  // Botón de reinicio
  const resetStats = () => {
    setDistance(0);
    setSteps(0);
    setRoute([]);
  };

  // Mostrar historial en consola
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('history');
      if (saved) {
        console.log('Historial de recorridos:', JSON.parse(saved));
      }
    })();
  }, []);

  const getDistance = (c1, c2) => {
    const R = 6371e3;
    const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
    const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(c1.latitude * Math.PI / 180) *
      Math.cos(c2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000; // km
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker coordinate={location} />
          <Polyline coordinates={route} strokeWidth={3} strokeColor="blue" />
        </MapView>
      ) : (
        <Text>{errorMsg || 'Cargando ubicación...'}</Text>
      )}

      <View style={styles.info}>
        {loadedFromStorage && (
          <Text style={styles.storageMessage}>
            Última posición cargada del almacenamiento local
          </Text>
        )}
        <Text>Distancia recorrida: {distance.toFixed(2)} km</Text>
        <Text>Pasos estimados: {steps}</Text>
        <Text>Velocidad promedio: {(speed * 3.6).toFixed(2)} km/h</Text>
        <Text>Acelerómetro:</Text>
        <Text>x: {accelData.x.toFixed(2)} y: {accelData.y.toFixed(2)} z: {accelData.z.toFixed(2)}</Text>
        <Button title="Reiniciar métricas" onPress={resetStats} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  map: { width: Dimensions.get('window').width, height: 400 },
  info: { padding: 20, backgroundColor: '#fff' },
  storageMessage: {
    fontStyle: 'italic',
    color: 'green',
    marginBottom: 10,
  },
});
