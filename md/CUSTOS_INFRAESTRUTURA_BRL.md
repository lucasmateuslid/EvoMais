# Estimativa de Custos de Infraestrutura (BRL)

Data de referência: 16/04/2026  
Escopo: custos operacionais da EvoMais (Banco de Dados, IA, Backend, Frontend, VPS com Docker para Redis, Kafka, Evolution API e fallback com LLM local).  
Fora do escopo: custos da Meta/WhatsApp cobrados do cliente final.

## Premissas de Conversão

- Cotação usada para conversão: **USD 1 = BRL 5,30**
- Os valores abaixo são estimativas mensais e podem variar por região, provedor e perfil de uso.

## 1) Cenário Inicial Estruturado (10 empresas)

### Faixa por componente (mensal)

| Componente | USD | BRL (aprox.) |
|---|---:|---:|
| Supabase | 25 a 100 | 132,50 a 530,00 |
| VPS Docker (backend, Redis, Evolution, margem p/ Kafka) | 60 a 120 | 318,00 a 636,00 |
| Kafka (self-host, custo incremental) | 20 a 50 | 106,00 a 265,00 |
| Frontend/CDN | 5 a 20 | 26,50 a 106,00 |
| AWS e afins (logs, storage, backups, e-mail) | 15 a 60 | 79,50 a 318,00 |
| IA (APIs) | 80 a 350 | 424,00 a 1.855,00 |
| LLM local fallback (sem GPU dedicada) | 0 a 20 | 0,00 a 106,00 |
| LLM local fallback (com GPU pequena dedicada) | 80 a 220 | 424,00 a 1.166,00 |

### Total mensal (10 empresas)

- **Sem GPU dedicada para fallback:** BRL **1.086,50 a 3.710,00**
- **Com GPU dedicada para fallback:** BRL **1.510,50 a 4.876,00**
- **Faixa recomendada prática:** BRL **2.120,00 a 3.180,00**

## 2) Cenário de Crescimento Estruturado (50 empresas)

### Faixa por componente (mensal)

| Componente | USD | BRL (aprox.) |
|---|---:|---:|
| Supabase (compute/storage maior) | 100 a 500 | 530,00 a 2.650,00 |
| VPS cluster (2-3 nós) | 220 a 550 | 1.166,00 a 2.915,00 |
| Kafka (nó dedicado ou managed básico) | 80 a 300 | 424,00 a 1.590,00 |
| Frontend/CDN | 20 a 80 | 106,00 a 424,00 |
| AWS e afins | 40 a 180 | 212,00 a 954,00 |
| IA (APIs) | 400 a 2.000 | 2.120,00 a 10.600,00 |
| LLM local fallback com GPU | 150 a 600 | 795,00 a 3.180,00 |

### Total mensal (50 empresas)

- **Faixa total estimada:** BRL **5.353,00 a 22.313,00**
- **Faixa recomendada prática:** BRL **8.480,00 a 13.780,00**

## 3) Custo Médio por Empresa (referência)

- **10 empresas (faixa recomendada):** BRL **212,00 a 318,00** por empresa/mês
- **50 empresas (faixa recomendada):** BRL **169,60 a 275,60** por empresa/mês

## 4) Fórmula rápida para sensibilidade de IA

\[
C_{IA} \approx \frac{ReqDia \times TokensPorReq \times 30}{1.000.000} \times PrecoPor1M
\]

Onde:

- `ReqDia` = chamadas de IA por dia
- `TokensPorReq` = tokens médios por chamada (entrada + saída)
- `PrecoPor1M` = preço do provedor por 1 milhão de tokens

## 5) Observações importantes

- O principal driver de custo é IA (volume de requisições e tamanho de contexto).
- Kafka ainda não está ativo no `docker-compose.yml` atual; custo tratado como **incremental** para arquitetura mais robusta.
- Se o fallback local virar canal principal (e não apenas contingência), a tendência é exigir GPU maior e elevar significativamente o custo.
- Recomenda-se revisar esta estimativa mensalmente com base no uso real (tokens, throughput de filas e conexões simultâneas).