import {
  densityScore,
  distanceToPolyline,
  exposureScore,
  finalizeContext,
  roadClassOf,
  settlementOf,
} from './expansion-location-context';

describe('expansion location context', () => {
  it('maps OSM highway tags to road classes', () => {
    expect(roadClassOf('trunk_link')).toBe('HIGHWAY');
    expect(roadClassOf('primary')).toBe('PRIMARY');
    expect(roadClassOf('residential')).toBe('LOCAL');
    expect(roadClassOf('footway')).toBe('PATH');
    expect(roadClassOf(undefined)).toBe('UNKNOWN');
  });

  it('measures the distance to the closest segment of a road', () => {
    const point = { lat: 13.7, lon: -89.2 };
    const road = [
      { lat: 13.7009, lon: -89.201 },
      null,
      { lat: 13.7009, lon: -89.199 },
    ];
    expect(distanceToPolyline(point, road)).toBeGreaterThan(95);
    expect(distanceToPolyline(point, road)).toBeLessThan(105);
    expect(distanceToPolyline(point, [])).toBe(Infinity);
  });

  it('rates a local street low unless a main road is close', () => {
    const local = { name: 'Pasaje 3', roadClass: 'LOCAL' as const };
    expect(exposureScore(local, [])).toBeCloseTo(0.2);
    expect(
      exposureScore(local, [
        { name: 'Alameda', roadClass: 'PRIMARY', distanceM: 30 },
      ]),
    ).toBeCloseTo(0.9);
    expect(
      exposureScore(local, [
        { name: 'Alameda', roadClass: 'PRIMARY', distanceM: 380 },
      ]),
    ).toBeCloseTo(0.2);
  });

  it('scores density from shops, buildings and settlement type', () => {
    expect(densityScore('RURAL', null, null)).toBeCloseTo(0.1);
    expect(densityScore('CITY', 150, 400)).toBeGreaterThan(0.9);
    expect(densityScore('TOWN', 2, 10)).toBeLessThan(0.4);
    expect(settlementOf({ hamlet: 'X', city: 'San Salvador' })).toBe('CITY');
    expect(settlementOf({ village: 'El Milagro' })).toBe('VILLAGE');
  });

  it('derives traffic and density levels', () => {
    const context = finalizeContext({
      version: 1,
      fetchedAt: '2026-11-04T00:00:00.000Z',
      sources: { nominatim: true, overpass: false },
      road: { name: 'Carretera Panamericana', roadClass: 'HIGHWAY' },
      majorRoads: [],
      locality: {
        neighbourhood: null,
        suburb: null,
        city: null,
        municipality: null,
        department: 'San Vicente',
      },
      settlement: 'RURAL',
      poiCount500m: null,
      buildingCount300m: null,
      landuse: [],
    });
    expect(context.trafficLevel).toBe('HIGH');
    expect(context.densityLevel).toBe('LOW');
  });
});
