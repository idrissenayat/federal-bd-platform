# Ingestion worker

The first worker polls the approved SAM.gov public Opportunities API, preserves immutable evidence, normalizes records, detects material changes, and schedules qualification.

It must follow `docs/sources/SOURCE-REGISTER.md` and pass Exam `0003` before activation. A failed or partial poll never advances its checkpoint as complete.

