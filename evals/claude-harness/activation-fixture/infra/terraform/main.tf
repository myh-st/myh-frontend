provider "google" { project = var.project_id  region = var.region }
variable "project_id" {}
variable "region" { default = "asia-southeast1" }
