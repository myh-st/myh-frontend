from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.getOrCreate()
orders = spark.read.parquet("gs://acme/orders")
customers = spark.read.parquet("gs://acme/customers")
df = orders.join(customers, "customer_id").groupBy("country", "customer_id").agg(F.sum("total")).repartition(2000)
df.orderBy(F.desc("sum(total)")).write.mode("overwrite").parquet("gs://acme/out")
