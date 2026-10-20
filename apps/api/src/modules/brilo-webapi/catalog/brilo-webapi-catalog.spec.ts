import {
  findBriloEndpoint,
  getBriloModel,
  listBriloEndpoints,
  matchBriloEndpoint,
  nestedBriloModels,
} from './brilo-webapi-catalog';
import {
  extractRulesLinks,
  findModuleRules,
  findRulesForEndpoint,
  parseModuleRules,
} from './brilo-webapi-rules';

describe('Brilo catalog', () => {
  it('lists every endpoint the app calls', () => {
    const used = [
      ['GET', '/api/Bancos/GetAbonosBco'],
      ['POST', '/api/Bancos/SetAbonoBco'],
      ['DELETE', '/api/Bancos/DelCargoBco'],
      ['GET', '/api/v2/Comun/GetCuentasBco'],
      ['GET', '/api/v2/Conta/Partidas'],
      ['POST', '/api/v2/Conta/Partida'],
      ['GET', '/api/v2/Ventas/Facturas'],
      ['GET', '/api/v2/Ventas/ODFs'],
      ['GET', '/api/v2/CXC/GetAbonosFacturas'],
      ['POST', '/api/v2/CXC/AbonoFactura'],
      ['POST', '/api/v2/CXC/AbonoCliente'],
      ['POST', '/api/v2/CXC/AnticipoVenta'],
      ['POST', '/api/Vallas/Cotizaciones'],
      ['POST', '/api/Vallas/Contratos'],
    ] as const;
    for (const [method, path] of used) {
      expect(matchBriloEndpoint(method, path)?.doc.path).toBe(path);
    }
  });

  it('only lists current versions of the CXC endpoints', () => {
    const cxc = listBriloEndpoints().filter((doc) => doc.module === 'CXC');
    expect(cxc.length).toBeGreaterThan(0);
    expect(cxc.every((doc) => doc.path.startsWith('/api/v2/CXC/'))).toBe(true);
  });

  it('resolves endpoints by operation id and by method and path', () => {
    const byId = findBriloEndpoint('apiV2CXCAbonoFacturaPost');
    expect(byId?.path).toBe('/api/v2/CXC/AbonoFactura');
    expect(findBriloEndpoint('POST /v2/CXC/AbonoFactura')).toBe(byId);
  });

  it('resolves body models whether written as array, list or bare name', () => {
    expect(getBriloModel('AbonosXFacturaModelExtended')?.fields.length).toBe(
      18,
    );
    expect(getBriloModel('array[AbonosExtendedModel]')?.name).toBe(
      'AbonosExtendedModel',
    );
    const abonos = getBriloModel('AbonosExtendedModel');
    expect(nestedBriloModels(abonos?.fields ?? [])).toContain(
      'detPartidasExtendedModel',
    );
  });
});

describe('Brilo business rules', () => {
  const linkset = {
    linkset: [
      {
        anchor: '/api/Bancos/[action]',
        'https://briloerp.com/rels/business-rules': [
          { href: '/.well-known/api-catalog/rules/Bancos' },
        ],
      },
      {
        anchor: '/api/v3/Comun/Clientes',
        'https://briloerp.com/rels/business-rules': [
          { href: '/.well-known/api-catalog/rules/ComunClientesV3' },
        ],
      },
    ],
  };

  const cxc = parseModuleRules('CXC', {
    summary: 'Cobros',
    crossCuttingRules: ['Rule A', 3],
    endpoints: [
      {
        actionName: 'AbonoFactura',
        verb: 'POST',
        routes: 'POST POST /api/CXC/AbonoFactura',
        businessRules: ['Debe existir la factura'],
      },
      {
        actionName: 'AbonoAnticipo',
        verb: 'POST',
        routes:
          'POST /api/CXC/AbonoAnticipoVenAODF,POST /api/CXC/AbonoAnticipoVenAFacturas',
      },
    ],
  });
  const comun = parseModuleRules('Comun', {
    endpoints: {
      actionName: 'Productos',
      verb: 'GET',
      routes: 'GET /api/Comun/Productos,/api/Comun/GetProductos',
    },
    additionalEndpoints: [
      { verb: 'GET/POST', routes: ['GET /api/v2/Comun/About'] },
    ],
  });

  it('reads the rule document links from the api-catalog linkset', () => {
    expect(extractRulesLinks(linkset)).toEqual([
      '/.well-known/api-catalog/rules/Bancos',
      '/.well-known/api-catalog/rules/ComunClientesV3',
    ]);
    expect(extractRulesLinks(null)).toEqual([]);
  });

  it('normalizes the different shapes of routes and endpoints', () => {
    expect(cxc.crossCuttingRules).toEqual(['Rule A']);
    expect(cxc.endpoints[0].routes).toEqual([
      { method: 'POST', path: '/api/CXC/AbonoFactura' },
    ]);
    expect(cxc.endpoints[1].routes.map((r) => r.path)).toEqual([
      '/api/CXC/AbonoAnticipoVenAODF',
      '/api/CXC/AbonoAnticipoVenAFacturas',
    ]);
    expect(comun.endpoints).toHaveLength(2);
    expect(comun.endpoints[0].routes).toHaveLength(2);
  });

  it('matches rules written for an older version of the endpoint', () => {
    const [match] = findRulesForEndpoint(
      [cxc],
      'POST',
      '/api/v2/CXC/AbonoFactura',
    );
    expect(match.sameVersion).toBe(false);
    expect(match.matchedRoute).toBe('POST /api/CXC/AbonoFactura');
    expect(match.rules.businessRules).toEqual(['Debe existir la factura']);
  });

  it('prefers the exact version and honours the HTTP method', () => {
    const [match] = findRulesForEndpoint(
      [cxc],
      'POST',
      '/api/CXC/AbonoFactura',
    );
    expect(match.sameVersion).toBe(true);
    expect(findRulesForEndpoint([cxc], 'GET', '/api/CXC/AbonoFactura')).toEqual(
      [],
    );
  });

  it('finds module rules by name prefix', () => {
    const clientes = parseModuleRules('ComunClientesV3', {});
    expect(
      findModuleRules([cxc, comun, clientes], 'comun').map((m) => m.name),
    ).toEqual(['Comun', 'ComunClientesV3']);
    expect(findModuleRules([cxc], '')).toEqual([]);
  });
});
