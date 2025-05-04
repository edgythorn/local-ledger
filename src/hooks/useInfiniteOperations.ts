import { useEffect, useRef, useState } from 'react';
import { OperationsService, Operation } from '../services/operationsService';

export function useInfiniteOperations(batchSize = 50) {
  const serviceRef = useRef(new OperationsService());
  const [ops, setOps] = useState<Operation[]>([]);
  const [hasPrev, setHasPrev] = useState(true);
  const [hasNext, setHasNext] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { items: prevItems, hasPrev: _hasPrev } = await serviceRef.current.prev(batchSize);
      const { items: nextItems, hasNext: _hasNext } = await serviceRef.current.next(batchSize);
      setOps([...prevItems.reverse(), ...nextItems]);
      setHasPrev(_hasPrev);
      setHasNext(_hasNext);
      setLoading(false);
    })();
  }, [batchSize]);

  const loadPrev = async () => {
    if (!hasPrev || loading) return;
    setLoading(true);
    const { items, hasPrev: _hasPrev } = await serviceRef.current.prev(batchSize);
    setOps((cur) => [...items.reverse(), ...cur]);
    setHasPrev(_hasPrev);
    setLoading(false);
  };

  const loadNext = async () => {
    if (!hasNext || loading) return;
    setLoading(true);
    const { items, hasNext: _hasNext } = await serviceRef.current.next(batchSize);
    setOps((cur) => [...cur, ...items]);
    setHasNext(_hasNext);
    setLoading(false);
  };

  return { ops, loadPrev, loadNext, hasPrev, hasNext, loading };
}
