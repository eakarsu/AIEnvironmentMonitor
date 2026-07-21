# Governed environmental investigation workflow

`/api/governed-investigations` requires registered active devices, credential fingerprints, calibration versions, units, timestamps, source IDs, and idempotency keys. It stores outlier decisions without discarding raw observations, requires analyst quality acceptance, retains corrections and chain-of-custody events, and opens investigations only from accepted observations against a versioned threshold.

Sensor gateways, laboratories, GIS/weather, regulatory systems, maintenance, and alerts remain external adapters. Device certificate issuance/rotation, laboratory chain-of-custody procedures, calibrated hardware, regulatory submission, spatial/statistical validation, and alert-precision evaluation require real systems and qualified analysts.

Bootstrap, schema migration, startup, and demo seeding are explicitly separate.
