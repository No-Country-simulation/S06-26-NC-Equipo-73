import { useEffect, useState } from "react";
import { getMapIndicatorCatalog } from "../data/mapDataSource";
import type { MapIndicatorCatalogItem } from "../types";

type UseMapIndicatorsResult = {
  data: MapIndicatorCatalogItem[];
  error: string | null;
  isLoading: boolean;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible cargar los indicadores.";
}

export function useMapIndicators(): UseMapIndicatorsResult {
  const [data, setData] = useState<MapIndicatorCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadIndicators = async () => {
      try {
        const indicators = await getMapIndicatorCatalog();

        if (!isMounted) {
          return;
        }

        setData(indicators);
        setError(null);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setData([]);
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadIndicators();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    data,
    error,
    isLoading,
  };
}
