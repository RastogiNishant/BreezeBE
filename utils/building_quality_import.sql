TRUNCATE build_qualities;
-- Create util table

DROP TABLE IF EXISTS street_tmp;
CREATE TABLE street_tmp
(
  id          SERIAL,
  name        VARCHAR(255),
  build_start VARCHAR(10),
  build_end   VARCHAR(10),
  region      VARCHAR(255),
  quality     VARCHAR(255),
  PRIMARY KEY (id)
);
UPDATE street_tmp
SET name        = TRIM(BOTH FROM name),
    build_start = TRIM(BOTH FROM build_start),
    build_end   = TRIM(BOTH FROM build_end),
    region      = TRIM(BOTH FROM region),
    quality     = TRIM(BOTH FROM quality)
WHERE
  TRUE;

DROP TABLE IF EXISTS zip_tmp;
CREATE TABLE zip_tmp
(
  id     SERIAL,
  code   VARCHAR(10),
  region VARCHAR(255),
  PRIMARY KEY (id)
);

-- Import data
COPY street_tmp (name, build_start, build_end, region, quality) FROM '/streets.csv' DELIMITER ',';

COPY zip_tmp (code, region) FROM '/index.csv' DELIMITER ',';
UPDATE zip_tmp
SET code   = TRIM(BOTH FROM code),
    region = TRIM(BOTH FROM region)
WHERE
  TRUE;

DROP TABLE IF EXISTS tmp_res;
CREATE TEMPORARY TABLE tmp_res AS (
  SELECT _t2.region,
         _t2.name,
         _t2.quality,
         array_to_json(ARRAY_AGG(_z.code)) AS zip,
         (array_agg(num))[1]               as num,
         (array_agg(_z.id))[1]             as region_id
  FROM (
    SELECT region, name, quality, array_to_string(ARRAY_AGG(CONCAT(build_start, ',', build_end)), ';') AS num
    FROM street_tmp as _s1
    GROUP BY _s1.region, _s1.name, _s1.quality
  ) AS _t2
    INNER JOIN zip_tmp AS _z
      ON _z.region = _t2.region
  GROUP BY _t2.region, _t2.name, _t2.quality
);


-- Fill general table
INSERT INTO build_qualities
(name,
 region_id,
 quality,
 zip,
 build_num) (
  SELECT _t2.name,
         _t2.region_id,
         _t2.quality,
         _t2.zip,
         (CASE
            WHEN _t2.cnt > 1 THEN _t2.num
            WHEN _t2.num = ',' THEN NULL
            ELSE NULL END
           ) AS num
  FROM (
    SELECT _t.*,
           (SELECT count(*) FROM tmp_res AS _st1 WHERE _st1.region = _t.region AND _st1.name = _t.name) as cnt
    FROM tmp_res as _t
  ) AS _t2
);

-- Clear tmp
DROP TABLE IF EXISTS zip_tmp;
DROP TABLE IF EXISTS street_tmp;
DROP TABLE IF EXISTS tmp_res;
