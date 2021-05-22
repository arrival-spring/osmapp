import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Typography } from '@material-ui/core';
import { fetchAroundFeature } from '../../services/osmApi';
import { useFeatureContext } from '../utils/FeatureContext';
import { Feature } from '../../services/types';
import { getShortId, getUrlOsmId } from '../../services/helpers';
import { icons } from '../../assets/icons';
import Maki from '../utils/Maki';
import { t } from '../../services/intl';

const useLoadingState = () => {
  const [around, setAround] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const finishAround = (payload) => {
    setLoading(false);
    setAround(payload);
  };
  const startAround = () => {
    setLoading(true);
    setAround([]);
  };
  return { around, loading, startAround, finishAround };
};

const AroundItem = ({ feature }: { feature: Feature }) => {
  const { properties, tags, osmMeta } = feature;
  const ico = icons.includes(properties.class)
    ? properties.class
    : 'information';
  const subclass = properties.subclass || osmMeta.type;

  return (
    <li>
      <Maki
        ico={ico}
        title={`${Object.keys(tags).length} keys / ${
          properties.class ?? ''
        } / ${subclass}`}
      />
      <Link href={`/${getUrlOsmId(osmMeta)}`}>
        {tags.name ?? subclass ?? '?'}
      </Link>
    </li>
  );
};

// TODO make SSR ?
export const ObjectsAround = ({ advanced }) => {
  const { feature } = useFeatureContext();
  const { around, loading, startAround, finishAround } = useLoadingState();
  const [error, setError] = useState();

  useEffect(() => {
    startAround();
    setError(undefined);
    if (feature.center) {
      fetchAroundFeature(feature.center).then(finishAround, setError);
    }
  }, [getShortId(feature.osmMeta)]);

  if (!feature.center) {
    return null;
  }

  const features = advanced
    ? around
    : around
        .filter((item: Feature) => {
          if (getShortId(item.osmMeta) === getShortId(feature.osmMeta))
            return false;
          if (!item.properties.subclass && Object.keys(item.tags).length <= 2)
            return false;
          if (item.properties.subclass === 'building:part') return false;
          return true;
        })
        .sort(
          (a, b) =>
            (b.properties.class === 'home' ? -5 : Object.keys(b.tags).length) - // leave address points at the bottom
            Object.keys(a.tags).length,
        )
        .slice(0, 10);

  return (
    <Box mt={4} mb={4}>
      <Typography variant="overline" display="block" color="textSecondary">
        {t('featurepanel.objects_around')}
      </Typography>

      {error && (
        <Typography color="secondary" paragraph>
          {t('error')}: {`${error}`.substring(0, 50)}
        </Typography>
      )}

      {loading && (
        <Typography color="secondary" paragraph>
          {t('loading')}
          <span className="dotloader">.</span>
          <span className="dotloader">.</span>
          <span className="dotloader">.</span>
        </Typography>
      )}

      {!loading && !features.length && (
        <Typography color="secondary" paragraph>
          none
        </Typography>
      )}

      <ul>
        {features.map((item) => (
          <AroundItem key={getShortId(item.osmMeta)} feature={item} />
        ))}
      </ul>
    </Box>
  );
};