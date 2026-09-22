#!/bin/bash

# Tạo namespace monitoring nếu chưa có
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Thêm các Helm repositories cần thiết
echo "Thêm Helm repositories..."
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm repo update

# Đảm bảo bạn đã gắn label và taint cho Node Monitoring trước khi chạy script này:
# kubectl label nodes <TÊN_NODE> role=monitoring
# kubectl taint nodes <TÊN_NODE> dedicated=monitoring:NoSchedule

# 1. Cài đặt Loki và Promtail (Loki-stack)
echo "Cài đặt Loki & Promtail..."
helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set loki.image.tag=2.9.3 \
  --set loki.nodeSelector.role=monitoring \
  --set "loki.tolerations[0].key=dedicated,loki.tolerations[0].operator=Equal,loki.tolerations[0].value=monitoring,loki.tolerations[0].effect=NoSchedule" \
  --set "promtail.tolerations[0].key=dedicated,promtail.tolerations[0].operator=Equal,promtail.tolerations[0].value=monitoring,promtail.tolerations[0].effect=NoSchedule"

# 2. Cài đặt Grafana Tempo (S3-Backed)
echo "Cài đặt Tempo..."
helm upgrade --install tempo grafana/tempo \
  --namespace monitoring \
  --set tempo.nodeSelector.role=monitoring \
  --set "tempo.tolerations[0].key=dedicated,tempo.tolerations[0].operator=Equal,tempo.tolerations[0].value=monitoring,tempo.tolerations[0].effect=NoSchedule" \
  -f tempo-s3-values.yaml

# 3. Cài đặt Grafana
echo "Cài đặt Grafana..."
helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --set service.type=NodePort \
  --set nodeSelector.role=monitoring \
  --set "tolerations[0].key=dedicated,tolerations[0].operator=Equal,tolerations[0].value=monitoring,tolerations[0].effect=NoSchedule"

echo "------------------------------------------------------"
echo "Quá trình cài đặt hoàn tất!"
echo "Các service đã được triển khai trong namespace 'monitoring'."
echo ""
echo "Để lấy mật khẩu admin của Grafana, chạy lệnh:"
echo "kubectl get secret --namespace monitoring grafana -o jsonpath=\"{.data.admin-password}\" | base64 --decode ; echo"
echo ""
echo "Để xem các port (NodePort) của Grafana và Jaeger, chạy lệnh:"
echo "kubectl get svc -n monitoring"
echo "------------------------------------------------------"
