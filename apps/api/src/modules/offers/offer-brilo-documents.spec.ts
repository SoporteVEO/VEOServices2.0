import { OfferItemType } from '@prisma/client';
import {
  briloMonthlyRent,
  briloStaticItems,
  buildBriloContrato,
  matchExecutivesByName,
  type BriloExecutiveOption,
} from './offer-brilo-documents';

const executives: BriloExecutiveOption[] = [
  { ejecId: 22, ejecCodigo: '019', ejecNombre: 'Luis Segovia ' },
  { ejecId: 15, ejecCodigo: '012', ejecNombre: 'LUIS CESTONI' },
  { ejecId: 23, ejecCodigo: '020', ejecNombre: 'Marta Descamps' },
];

describe('matchExecutivesByName', () => {
  it('matches a short Brilo name inside a longer VEO name, ignoring accents', () => {
    const result = matchExecutivesByName(
      'Luis Alberto Segovia Pérez',
      executives,
    );
    expect(result.map((e) => e.ejecId)).toEqual([22]);
  });

  it('returns every candidate when the name is ambiguous', () => {
    const result = matchExecutivesByName('Luis', executives);
    expect(result.map((e) => e.ejecId)).toEqual([22, 15]);
  });

  it('returns nothing for an unknown or empty name', () => {
    expect(matchExecutivesByName('Ana López', executives)).toEqual([]);
    expect(matchExecutivesByName(null, executives)).toEqual([]);
  });
});

describe('Brilo documents', () => {
  const staticItem = {
    itemType: OfferItemType.STATIC_BILLBOARD,
    billboardId: 238,
    quantity: 1,
    impressionPrice: 275,
    rentalPrice: 1200,
    startDate: new Date('2026-11-01T06:00:00.000Z'),
    endDate: new Date('2027-02-28T06:00:00.000Z'),
  };

  it('splits the period rent into the monthly amount Brilo bills', () => {
    expect(briloMonthlyRent(staticItem)).toBe(300);
  });

  it('only sends static billboards with a Brilo face', () => {
    const items = briloStaticItems([
      staticItem,
      {
        ...staticItem,
        itemType: OfferItemType.DIGITAL_BILLBOARD,
        billboardId: null,
      },
      { ...staticItem, itemType: OfferItemType.MISC, billboardId: null },
    ]);
    expect(items).toHaveLength(1);
  });

  it('builds a posted contract linked to the cotización', () => {
    const body = buildBriloContrato(
      {
        offerNumber: 'COT0001/26',
        customerName: 'Cliente',
        customerContact: null,
        cliId: 2375,
        ejecId: 22,
      },
      [staticItem],
      61294,
    );
    expect(body).toMatchObject({
      mcotId: 61294,
      cliId: 2375,
      ejecId: 22,
      mconPosteado: true,
      mconAnulado: false,
      mconFechaInicio: '2026-11-01T00:00:00',
      mconFechaFin: '2027-02-28T00:00:00',
    });
    expect(body.detalles[0]).toMatchObject({
      caraId: 238,
      dconCostoArrendamiento: 300,
      dconCostoImpresion: 275,
    });
  });
});
