---
title: Query objects within an area with GeoDjango (part 2)
author: Vasyl Dizhak
date: 2021-05-02
path: /query-objects-with-geodjango-part-2
tags: ["geodjango", "django", "ORM", "postgis", "GIS"]
resources: ["https://docs.djangoproject.com/en/3.0/ref/contrib/gis/db-api/"]
---

![GeoDjango](../images/posts/geodjango-distance-queries/GeoDjango-poster.png)
The first [article](/query-objects-with-geodjango-part-1) mentioned concerns about the speed 
of the selected approach as for every geometry an additional buffer should be prepared and that is rather time-consuming.
It is about time to measure these performance penalties and see what we can do with them.

## Prepare sample dataset for the testing

```python
def generate_sample_data(num: int) -> None:
    search_criteria = []
    for index in range(num):
        search_criteria.append(
            SearchCriteria(
                geo_location=Point(
                    random.randint(-180, 180),
                    random.randint(-90, 90),
                ),
                distance=random.randint(1000, 30000)
            )
        )
    SearchCriteria.objects.bulk_create(search_criteria)

```

From the product estimation we should be dealing with ~ 100k objects, so let's create about that amount of data randomly 
distributed on our map. This step is required to check the performance of using dynamic `buffer` generation for our objects.


```python

def generate():
    for i in range(100):
        print(i)
        generate_sample_data(1000)
```

## Measure execution time of building a dynamic buffer

```python
In [1]: poi = POI.objects.first() 
In [2]: %time  SearchCriteria.objects.with_buffer().filter(buff__intersects=poi.geo_location).count()                                                                                           
CPU times: user 1.56 ms, sys: 901 µs, total: 2.46 ms
Wall time: 7.89 s
Out[2]: 4
```

As we tell, this is absolutely inappropriate execution time of `~ 8sec` 🚫. To profile it we could check the SQL query that 
shows us `ST_Buffer` function being used twice across the entire table.

```sql
SELECT 
    "core_searchcriteria"."id", 
    "core_searchcriteria"."geo_location"::bytea, 
    "core_searchcriteria"."distance", 
    ST_Buffer(
        CAST("core_searchcriteria"."geo_location" AS geography(POINT,4326)), "core_searchcriteria"."distance"
        )::bytea AS "buff" FROM "core_searchcriteria" 
    WHERE ST_Intersects(
        ST_Buffer(
            CAST("core_searchcriteria"."geo_location" AS geography(POINT,4326)), "core_searchcriteria"."distance"), 
        ST_GeomFromEWKB('\001\001\000\000 \346\020\000\000\000\000\000\000\000@U@\000\000\000\000\000\000@@'::bytea)
    )
```

## Using geography columns

For much better performance on distance queries, we could use `geography` 
columns that can use their spatial index in distance queries. 
You can tell GeoDjango to use a geography column by setting geography=True in your field definition.

```python
class SearchCriteria(models.Model):
    geo_location = PointField(
        verbose_name='Location coordinates',
        geography=True,
    )
    distance = models.PositiveIntegerField(
        verbose_name='Search radius (in meters)',
        default=20000,
        validators=[
            MinValueValidator(100),
            MaxValueValidator(30000),
        ],
    )

    objects = SearchCriteriaManager()
```
Django automatically adds an index to all `SpatialFields` by settings default `spatial_index=True`. 
Let's have a look at how the SQL definition of our table looks like after migration.

```shell
searchapp=# \d+ core_searchcriteria;
Table "public.core_searchcriteria"
    Column    |         Type          | Collation | Nullable |                     Default                     | Storage | Stats target | Description 
--------------+-----------------------+-----------+----------+-------------------------------------------------+---------+--------------+-------------
 id           | bigint                |           | not null | nextval('core_searchcriteria_id_seq'::regclass) | plain   |              | 
 geo_location | geography(Point,4326) |           | not null |                                                 | main    |              | 
 distance     | integer               |           | not null |                                                 | plain   |              | 
Indexes:
    "core_searchcriteria_pkey" PRIMARY KEY, btree (id)
    "core_searchcriteria_geo_location_id" gist (geo_location)
Check constraints:
    "core_searchcriteria_distance_check" CHECK (distance >= 0)

```

With the `geography` field type we will be able to use regular [`ST_DWithin`](https://postgis.net/docs/ST_DWithin.html) lookups in Django. 

```python
In [5]: %time SearchCriteria.objects.filter(
    geo_location__dwithin=(poi.geo_location, F('distance'))
 ).count()                                                                                                                                                     
CPU times: user 1.25 ms, sys: 1.04 ms, total: 2.29 ms
Wall time: 85.9 ms
```

Execution speed was `~90x` 🤯 faster comparing to generating buffers and calculating intersections. While it might sound like a silver bullet such an approach comes with certain caveats and shouldn't be considered as a universal solution especially when you perform other different operations on your geometries. Because geography calculations
involve more mathematics, only a subset of the PostGIS spatial lookups are available for the geography type.
Except for the various `distance` lookups it supports also `bboverlaps`, `coveredby`, `covers`and `intersects`. For the other
types of operations you could cast your `geography` field back to regular `geometry` and you can find more about it [here](https://docs.djangoproject.com/en/3.2/ref/contrib/gis/model-api/#geography-type).

## An alternative approach with the Distance query

One more possibility that we have without changing the type of our spatial field is based on the pre-calculating
distance to the given point of interest and then checking if it lies in the range of the search radius.
For that, we will be using another spatial function called distance `Distance` and extend our manager with another method.

```python
# managers.py

from django.contrib.gis.db.models.functions import GeoFunc, Distance

class SearchCriteriaManager(Manager):
    ...
    
    def distance_to(self, point: Point) -> QuerySet:
        return self.annotate(
            ds=Distance('geo_location', point)
        )
```

This way we got an increase in performance in `~65x` times which could be a great compromise if you don't want
converting your fields to the `geometry` types.

```python
In [7]: poi = POI.objects.first()                                                                                                                                                                                                                                

In [8]: %timeit SearchCriteria.objects.distance_to(poi.geo_location).filter(ds__lte=F('distance')).count()                                                                                                                                                       
124 ms ± 2.09 ms per loop (mean ± std. dev. of 7 runs, 10 loops each)
```

Skipping the `count()` part the example above gives us the following SQL query where `ST_DistanceSphere` function 
will very efficiently be using spatial index in `PostGIS`.

```sql
SELECT 
    "core_searchcriteria"."id", 
    "core_searchcriteria"."geo_location"::bytea,
     "core_searchcriteria"."distance",
     ST_DistanceSphere(
        "core_searchcriteria"."geo_location", 
        ST_GeomFromEWKB('\001\001\000\000 \346\020\000\000\000\000\000\000\000@U@\000\000\000\000\000\000@@'::bytea)) AS "ds" 
     FROM "core_searchcriteria" 
        WHERE ST_DistanceSphere(
            "core_searchcriteria"."geo_location", 
            ST_GeomFromEWKB('\001\001\000\000 \346\020\000\000\000\000\000\000\000@U@\000\000\000\000\000\000@@'::bytea)
        ) <= "core_searchcriteria"."distance";

```


## Footnotes
It is fascinating how one problem could have a variety of different solutions in Django world.
The topic of spatial queries is vast, and I genially recommend checking the documentation of the PostGIS when facing similar performance issues with your queries. Bye :)