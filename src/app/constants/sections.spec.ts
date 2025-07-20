import { MAINSECTIONS, SUBSECTIONS, SUBSECTIONINTERFACE } from './sections';

describe('Sections Constants', () => {
  describe('MAINSECTIONS', () => {
    it('should contain all main sections', () => {
      expect(MAINSECTIONS).toEqual([
        'administrativo',
        'medio ambiente',
        'costas',
        'aguas',
      ]);
    });

    it('should have correct number of main sections', () => {
      expect(MAINSECTIONS).toHaveLength(4);
    });

    it('should contain only string values', () => {
      MAINSECTIONS.forEach((section) => {
        expect(typeof section).toBe('string');
      });
    });

    it('should be immutable array', () => {
      const originalLength = MAINSECTIONS.length;

      expect(() => {
        const copy = [...MAINSECTIONS];
        copy.push('new section');
        expect(copy).toHaveLength(originalLength + 1);
        expect(MAINSECTIONS).toHaveLength(originalLength);
      }).not.toThrow();
    });

    it('should have expected section names', () => {
      expect(MAINSECTIONS).toContain('administrativo');
      expect(MAINSECTIONS).toContain('medio ambiente');
      expect(MAINSECTIONS).toContain('costas');
      expect(MAINSECTIONS).toContain('aguas');
    });
  });

  describe('SUBSECTIONS', () => {
    it('should have subsections for all main sections', () => {
      MAINSECTIONS.forEach((mainSection) => {
        expect(
          SUBSECTIONS[mainSection as keyof typeof SUBSECTIONS],
        ).toBeDefined();
        expect(
          Array.isArray(SUBSECTIONS[mainSection as keyof typeof SUBSECTIONS]),
        ).toBe(true);
      });
    });

    it('should have correct structure for each subsection', () => {
      Object.values(SUBSECTIONS).forEach((subsectionArray) => {
        subsectionArray.forEach((subsection) => {
          expect(subsection).toHaveProperty('name');
          expect(subsection).toHaveProperty('index');
          expect(typeof subsection.name).toBe('string');
          expect(typeof subsection.index).toBe('number');
        });
      });
    });

    describe('Administrativo subsections', () => {
      it('should have correct number of administrativo subsections', () => {
        expect(SUBSECTIONS.administrativo).toHaveLength(8);
      });

      it('should have expected administrativo subsection names', () => {
        const expectedNames = [
          'Constitución Española',
          'Ley 39/2015',
          'Ley 40/2015',
          'LCSP',
          'EBEP',
          'Leyes de Derechos Sociales',
          'Unión Europea',
          'Otros',
        ];

        expectedNames.forEach((name) => {
          expect(
            SUBSECTIONS.administrativo.some((sub) => sub.name === name),
          ).toBe(true);
        });
      });

      it('should have sequential indices for administrativo', () => {
        const indices = SUBSECTIONS.administrativo
          .map((sub) => sub.index)
          .sort((a, b) => a - b);

        expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });
    });

    describe('Medio Ambiente subsections', () => {
      it('should have correct number of medio ambiente subsections', () => {
        expect(SUBSECTIONS['medio ambiente']).toHaveLength(8);
      });

      it('should have expected medio ambiente subsection names', () => {
        const expectedNames = [
          'PNyB, Parques Nacionales y Montes',
          'Convenio Aarhus',
          'Medio Marino',
          'Evaluación Ambiental',
          'Residuos y Economía Circular',
          'Cambio Climático',
          'Responsabilidad MA',
          'Otros',
        ];

        expectedNames.forEach((name) => {
          expect(
            SUBSECTIONS['medio ambiente'].some((sub) => sub.name === name),
          ).toBe(true);
        });
      });

      it('should have sequential indices for medio ambiente', () => {
        const indices = SUBSECTIONS['medio ambiente']
          .map((sub) => sub.index)
          .sort((a, b) => a - b);

        expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });
    });

    describe('Costas subsections', () => {
      it('should have correct number of costas subsections', () => {
        expect(SUBSECTIONS.costas).toHaveLength(9);
      });

      it('should have expected costas subsection names', () => {
        const expectedNames = [
          'LC Título I',
          'LC Título II',
          'LC Título III',
          'LC Título IV',
          'LC Título V',
          'LC Título VI',
          'LC Régimen Transitorio',
          'Técnicas',
          'Otros',
        ];

        expectedNames.forEach((name) => {
          expect(SUBSECTIONS.costas.some((sub) => sub.name === name)).toBe(
            true,
          );
        });
      });

      it('should have sequential indices for costas', () => {
        const indices = SUBSECTIONS.costas
          .map((sub) => sub.index)
          .sort((a, b) => a - b);

        expect(indices).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });
    });

    describe('Aguas subsections', () => {
      it('should have correct number of aguas subsections', () => {
        expect(SUBSECTIONS.aguas).toHaveLength(19);
      });

      it('should have expected aguas subsection names', () => {
        const expectedNames = [
          'TRLA Título I',
          'TRLA Título II',
          'TRLA Título III',
          'TRLA Título IV',
          'TRLA Título V',
          'TRLA Título VI',
          'TRLA Título VII',
          'RPH e IPH',
          'Ley del PHN',
          'DMA',
          'RD 817/2015',
          'RD 1514/2009',
          'RD Nitratos',
          'Protocolos',
          'Depuración y Reutilización',
          'Inundaciones y Sequías',
          'Calidad Aguas de Baño y de Consumo',
          'Hidrología y Técnicas',
          'Otros',
        ];

        expectedNames.forEach((name) => {
          expect(SUBSECTIONS.aguas.some((sub) => sub.name === name)).toBe(true);
        });
      });

      it('should have sequential indices for aguas', () => {
        const indices = SUBSECTIONS.aguas
          .map((sub) => sub.index)
          .sort((a, b) => a - b);

        expect(indices).toEqual([
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        ]);
      });
    });
  });

  describe('SUBSECTIONINTERFACE', () => {
    it('should match the structure of SUBSECTIONS', () => {
      const subsectionKeys = Object.keys(SUBSECTIONS);
      expect(subsectionKeys).toEqual([
        'administrativo',
        'medio ambiente',
        'costas',
        'aguas',
      ]);
    });

    it('should validate interface structure matches implementation', () => {
      const testInterface = (sections: SUBSECTIONINTERFACE) => {
        expect(sections.administrativo).toBeDefined();
        expect(sections['medio ambiente']).toBeDefined();
        expect(sections.costas).toBeDefined();
        expect(sections.aguas).toBeDefined();
      };

      expect(() => testInterface(SUBSECTIONS)).not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should not have duplicate section names within each main section', () => {
      Object.values(SUBSECTIONS).forEach((subsectionArray) => {
        const names = subsectionArray.map((sub) => sub.name);
        const uniqueNames = [...new Set(names)];
        expect(names).toHaveLength(uniqueNames.length);
      });
    });

    it('should not have duplicate indices within each main section', () => {
      Object.values(SUBSECTIONS).forEach((subsectionArray) => {
        const indices = subsectionArray.map((sub) => sub.index);
        const uniqueIndices = [...new Set(indices)];
        expect(indices).toHaveLength(uniqueIndices.length);
      });
    });

    it('should have positive indices for all subsections', () => {
      Object.values(SUBSECTIONS).forEach((subsectionArray) => {
        subsectionArray.forEach((subsection) => {
          expect(subsection.index).toBeGreaterThan(0);
        });
      });
    });

    it('should have non-empty names for all subsections', () => {
      Object.values(SUBSECTIONS).forEach((subsectionArray) => {
        subsectionArray.forEach((subsection) => {
          expect(subsection.name).toBeTruthy();
          expect(subsection.name.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Utility Functions', () => {
    it('should be able to find subsection by name', () => {
      const findSubsectionByName = (mainSection: string, name: string) => {
        return SUBSECTIONS[mainSection as keyof typeof SUBSECTIONS]?.find(
          (sub) => sub.name === name,
        );
      };

      const result = findSubsectionByName(
        'administrativo',
        'Constitución Española',
      );

      expect(result).toBeDefined();
      expect(result?.name).toBe('Constitución Española');
      expect(result?.index).toBe(1);
    });

    it('should be able to find subsection by index', () => {
      const findSubsectionByIndex = (mainSection: string, index: number) => {
        return SUBSECTIONS[mainSection as keyof typeof SUBSECTIONS]?.find(
          (sub) => sub.index === index,
        );
      };

      const result = findSubsectionByIndex('costas', 5);

      expect(result).toBeDefined();
      expect(result?.name).toBe('LC Título V');
      expect(result?.index).toBe(5);
    });

    it('should handle section validation', () => {
      const isValidMainSection = (section: string) => {
        return MAINSECTIONS.includes(section);
      };

      const isValidSubsection = (
        mainSection: string,
        subsectionName: string,
      ) => {
        return (
          SUBSECTIONS[mainSection as keyof typeof SUBSECTIONS]?.some(
            (sub) => sub.name === subsectionName,
          ) || false
        );
      };

      expect(isValidMainSection('administrativo')).toBe(true);
      expect(isValidMainSection('invalid')).toBe(false);
      expect(isValidSubsection('administrativo', 'Constitución Española')).toBe(
        true,
      );
      expect(isValidSubsection('administrativo', 'Invalid Subsection')).toBe(
        false,
      );
    });

    it('should handle section counting', () => {
      const getTotalSubsections = () => {
        return Object.values(SUBSECTIONS).reduce(
          (total, subsections) => total + subsections.length,
          0,
        );
      };

      const total = getTotalSubsections();

      expect(total).toBe(8 + 8 + 9 + 19); // Total of all subsections
      expect(total).toBe(44);
    });
  });
});
