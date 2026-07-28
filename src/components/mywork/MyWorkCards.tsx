import React from 'react';
import {
  locationOutline,
  calendarOutline,
  flashOutline,
} from 'ionicons/icons';
import { Bid, ServiceRequest } from '../../types';
import { ListingCard } from '../listing';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';
import { bidPriceLabel } from '../../utils/bidPriceLabel';
import type { ListingStatusKey } from '../../utils/listingStatus';

interface MyWorkBidCardProps {
  bid: Bid;
  request: ServiceRequest;
  status: ListingStatusKey;
  statusLabel: string;
  onClick: () => void;
}

export const MyWorkBidCard: React.FC<MyWorkBidCardProps> = ({
  bid,
  request,
  status,
  statusLabel,
  onClick,
}) => {
  const preference = request.desiredExecutionTime?.trim();
  return (
    <ListingCard
      status={status}
      category={request.category}
      statusLabel={statusLabel}
      title={request.title}
      price={{
        variant: 'ownBid',
        value: bidPriceLabel(bid),
      }}
      metaRows={[
        { icon: locationOutline, text: request.address.split(',')[0] },
        preference
          ? { icon: calendarOutline, text: preference, tone: 'primary' }
          : {
              icon: flashOutline,
              text: 'Urgente: Lo antes posible',
              tone: 'urgent',
            },
      ]}
      onClick={onClick}
      media={{
        photoUrl: request.photoUrl,
        videoUrl: request.videoUrl,
        audioUrl: request.audioUrl,
      }}
      footer={{
        personPrefix: 'Cliente:',
        personName: request.client?.fullName?.split(' ')[0],
        rating: request.client?.rating,
      }}
    />
  );
};

interface MyWorkJobCardProps {
  job: ServiceRequest;
  status: ListingStatusKey;
  statusLabel: string;
  dateToShow: string;
  onClick: () => void;
}

export const MyWorkJobCard: React.FC<MyWorkJobCardProps> = ({
  job,
  status,
  statusLabel,
  dateToShow,
  onClick,
}) => (
  <ListingCard
    status={status}
    category={job.category}
    statusLabel={statusLabel}
    title={job.title}
    price={{
      variant: 'range',
      value: formatRequestPriceRangeEuros(job),
      caption: 'GANADO',
      tone: 'success',
    }}
    metaRows={[
      {
        icon: locationOutline,
        text: job.preciseAddress || job.address,
      },
      ...(dateToShow
        ? [
            {
              icon: calendarOutline,
              text: new Date(dateToShow).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
              }),
              tone: 'primary' as const,
            },
          ]
        : []),
    ]}
    onClick={onClick}
    media={{
      photoUrl: job.photoUrl,
      videoUrl: job.videoUrl,
      audioUrl: job.audioUrl,
    }}
    footer={{
      personPrefix: 'Cliente:',
      personName: job.client?.fullName?.split(' ')[0],
      rating: job.client?.rating,
    }}
  />
);
