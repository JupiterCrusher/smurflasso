# BigQuery Analysis

This project includes a small Google BigQuery analysis of Boise State University campus incident data.

## Dataset

The source data is a public campus incident log containing 197 records.

The data was uploaded to BigQuery as:

- Project: `bigquerylab-502817`
- Dataset: `bsu_crime`
- Main table: `CrimeData`

The original table includes:

- `reported`
- `nature`
- `location`
- `start`
- `end`
- `disposition`
- `case_number`

## Data Preparation

A reusable view named `cleaned_incidents` was created to standardize the source data and make later queries easier to read.

The view:

- Renames the reported date field
- Preserves incident type, location, disposition, and case number
- Exposes start and end values as usable date-time fields
- Avoids repeatedly rewriting cleanup logic in later queries

## Analysis Performed

The project includes queries for:

- Total number of incidents
- Incident counts by nature
- Incident counts by disposition
- Most recently reported incidents
- Monthly incident totals
- Most common incident locations
- Incident duration in minutes
- Broader incident categories using a lookup table and join

## Views

### `cleaned_incidents`

A cleaned, reusable version of the original incident table.

### `monthly_incident_summary`

A monthly aggregation showing the number of incidents reported each month.

## Category Lookup and Join

A second table named `nature_categories` was created with:

- `keyword`
- `category`

This table maps keywords found in incident descriptions to broader groups such as:

- Property Crime
- Violent Crime
- Drug or Alcohol
- Public Order

The category table is joined to the incident table using case-insensitive keyword matching.

The query counts distinct case numbers to reduce duplicate counting when one incident description matches multiple keywords.

## Example Queries

### Monthly Incident Totals

```sql
SELECT
  DATE_TRUNC(reported_date, MONTH) AS month,
  COUNT(*) AS incident_count
FROM `bigquerylab-502817.bsu_crime.cleaned_incidents`
GROUP BY month
ORDER BY month;
```

### Incident Duration

```sql
SELECT
  case_number,
  nature,
  location,
  DATETIME_DIFF(end_time, start_time, MINUTE) AS duration_minutes
FROM `bigquerylab-502817.bsu_crime.cleaned_incidents`
WHERE start_time IS NOT NULL
  AND end_time IS NOT NULL
ORDER BY duration_minutes DESC;
```

### Category Join

```sql
SELECT
  COALESCE(c.category, 'Other') AS category,
  COUNT(DISTINCT i.case_number) AS incident_count
FROM `bigquerylab-502817.bsu_crime.CrimeData` AS i
LEFT JOIN `bigquerylab-502817.bsu_crime.nature_categories` AS c
  ON LOWER(i.nature) LIKE CONCAT('%', LOWER(c.keyword), '%')
GROUP BY category
ORDER BY incident_count DESC;
```

## Skills Demonstrated

- Google BigQuery
- GoogleSQL
- Dataset and table creation
- CSV ingestion
- Schema inspection
- Date and date-time handling
- Aggregations
- Filtering
- Joins
- Calculated fields
- Views
- Basic data cleaning
- Analytical query design

## Limitations

The category mapping uses keyword-based matching rather than a trained classification model or manually verified labels. As a result:

- One incident may match more than one keyword
- Some incidents may remain categorized as `Other`
- Category quality depends on the completeness of the lookup table

The source dataset is also relatively small, so this project is meant to demonstrate a BigQuery workflow and SQL analysis rather than production-scale data warehousing.
