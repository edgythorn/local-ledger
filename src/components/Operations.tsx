import React, { UIEvent, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from './ui/table';
import { useInfiniteOperations } from '../hooks/useInfiniteOperations';
import { Operation } from '../services/operationsService';
import {
  CheckCircle,
  Calendar as CalendarIcon,
  Hourglass,
} from 'lucide-react';

interface OperationWithMeta extends Operation {
  balance: number;
  origin: 'fixed' | 'periodic' | 'adhoc';
}

export function Operations() {
  const { t, i18n } = useTranslation();
  const { ops, loadPrev, loadNext, hasPrev, hasNext, loading } =
    useInfiniteOperations();
  const containerRef = useRef<HTMLDivElement>(null);

  const dateF = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit', // короткий год
      }),
    [i18n.language]
  );
  const monthF = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        month: 'long',
        year: 'numeric',
      }),
    [i18n.language]
  );
  const intF = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        maximumFractionDigits: 0,
      }),
    [i18n.language]
  );

  const opsMeta = useMemo<OperationWithMeta[]>(() => {
    let balance = 0;
    return ops.map((op) => {
      balance += op.amount;
      const origin: OperationWithMeta['origin'] = op.id.startsWith('forecast')
        ? 'periodic'
        : 'fixed';
      return { ...op, balance, origin };
    });
  }, [ops]);

  const grouped = useMemo(() => {
    const map: Record<string, OperationWithMeta[]> = {};
    opsMeta.forEach((op) => {
      const m = monthF.format(new Date(op.date));
      (map[m] ||= []).push(op);
    });
    return Object.entries(map).map(([month, items]) => ({ month, items }));
  }, [opsMeta, monthF]);

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop === 0 && hasPrev && !loading) loadPrev();
    if (
      el.scrollHeight - el.scrollTop === el.clientHeight &&
      hasNext &&
      !loading
    )
      loadNext();
  };

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-semibold mb-4">{t('operations')}</h1>
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="flex-1 overflow-auto border rounded-lg"
      >
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: '10%' }} /> {/* Status */}
            <col style={{ width: '15%' }} /> {/* Date */}
            <col style={{ width: '40%' }} /> {/* Description */}
            <col style={{ width: '15%' }} /> {/* Amount */}
            <col style={{ width: '20%' }} /> {/* Balance */}
          </colgroup>

          <TableHeader className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-20">
            <TableRow>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('date')}</TableHead>
              <TableHead>{t('description')}</TableHead>
              <TableHead className="text-right">{t('amount')}</TableHead>
              <TableHead className="text-right">{t('balance')}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {grouped.map(({ month, items }) => (
              <React.Fragment key={month}>
                <tr>
                  <td
                    className="px-4 py-2 font-medium bg-gray-50 dark:bg-gray-900"
                    colSpan={5}
                  >
                    {month}
                  </td>
                </tr>
                {items.map((op) => {
                  let Icon = CalendarIcon;
                  let color = 'text-blue-500';
                  let statusKey = 'status.periodic';

                  if (op.origin === 'fixed') {
                    Icon = CheckCircle;
                    color = 'text-green-500';
                    statusKey = 'status.fixed';
                  } else {
                    // periodic vs adhoc
                    const isPast = new Date(op.date) < new Date();
                    if (op.origin === 'periodic') {
                      Icon = CalendarIcon;
                      color = isPast ? 'text-yellow-500' : 'text-blue-500';
                      statusKey = 'status.periodic';
                    } else {
                      Icon = Hourglass;
                      color = isPast ? 'text-red-500' : 'text-purple-500';
                      statusKey = 'status.adhoc';
                    }
                  }

                  return (
                    <TableRow key={op.id}>
                      {/* Status with localized tooltip */}
                      <TableCell
                        className="text-center"
                        title={t(statusKey)}
                      >
                        <Icon className={`w-5 h-5 ${color}`} />
                      </TableCell>

                      {/* Date with short year */}
                      <TableCell>
                        {dateF.format(new Date(op.date))}
                      </TableCell>

                      {/* Description */}
                      <TableCell>{op.description}</TableCell>

                      {/* Amount */}
                      <TableCell
                        className={`text-right ${
                          op.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {intF.format(op.amount)}
                      </TableCell>

                      {/* Balance colored like amount */}
                      <TableCell
                        className={`text-right ${
                          op.balance < 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {intF.format(op.balance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}

            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  {t('loading')}
                </td>
              </tr>
            )}
            {!loading && !hasNext && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  {t('no_more')}
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
