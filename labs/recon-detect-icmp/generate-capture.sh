#!/bin/bash
# Generate a realistic tcpdump capture log file for the ICMP detection lab
# This simulates what a defender would see when an attacker runs a ping sweep

LOG="/var/log/capture.log"
> "$LOG"

line=0
# Base timestamp: 2025-03-10 08:00:00
hour=8
min=0
sec=0
msec=100

# Helper: format timestamp
ts() {
  printf "%02d:%02d:%02d.%06d" "$hour" "$min" "$sec" "$msec"
}

# Advance time by a small random amount (sweep speed)
tick_fast() {
  msec=$((msec + RANDOM % 50 + 10))
  if [ $msec -ge 1000000 ]; then
    msec=$((msec - 1000000))
    sec=$((sec + 1))
  fi
  if [ $sec -ge 60 ]; then
    sec=$((sec - 60))
    min=$((min + 1))
  fi
}

tick_slow() {
  sec=$((sec + RANDOM % 3 + 1))
  if [ $sec -ge 60 ]; then
    sec=$((sec - 60))
    min=$((min + 1))
  fi
}

# --- Phase 1: Normal traffic before the sweep (lines 1-15) ---
for i in $(seq 1 4); do
  tick_slow
  echo "$(ts) IP 10.0.0.5 > 10.0.0.1: ICMP echo request, id 1001, seq $i, length 64" >> "$LOG"
  line=$((line + 1))
  tick_fast
  echo "$(ts) IP 10.0.0.1 > 10.0.0.5: ICMP echo reply, id 1001, seq $i, length 64" >> "$LOG"
  line=$((line + 1))
done

# A few ARP entries mixed in
tick_slow
echo "$(ts) ARP, Request who-has 10.0.0.1 tell 10.0.0.5, length 28" >> "$LOG"
line=$((line + 1))
tick_fast
echo "$(ts) ARP, Reply 10.0.0.1 is-at 02:42:0a:00:00:01, length 28" >> "$LOG"
line=$((line + 1))

# More normal traffic
for i in $(seq 5 6); do
  tick_slow
  echo "$(ts) IP 10.0.0.5 > 10.0.0.1: ICMP echo request, id 1001, seq $i, length 64" >> "$LOG"
  line=$((line + 1))
  tick_fast
  echo "$(ts) IP 10.0.0.1 > 10.0.0.5: ICMP echo reply, id 1001, seq $i, length 64" >> "$LOG"
  line=$((line + 1))
done

tick_slow
echo "$(ts) ARP, Request who-has 10.0.0.3 tell 10.0.0.1, length 28" >> "$LOG"
line=$((line + 1))

# --- Phase 2: The ping sweep begins (attacker 10.0.0.1 sweeps 10.0.0.0/24) ---
# This generates ~1000 ICMP echo requests from 10.0.0.1 to sequential IPs
sweep_id=4400
sweep_seq=1

for target_last_octet in $(seq 1 254); do
  target="10.0.0.${target_last_octet}"

  # Each target gets 3-5 pings (realistic fping -c behavior)
  pings=$((RANDOM % 3 + 3))
  for p in $(seq 1 $pings); do
    tick_fast
    echo "$(ts) IP 10.0.0.1 > ${target}: ICMP echo request, id ${sweep_id}, seq ${sweep_seq}, length 64" >> "$LOG"
    line=$((line + 1))
    sweep_seq=$((sweep_seq + 1))

    # Insert the flag at line 847
    if [ $line -eq 846 ]; then
      tick_fast
      echo "$(ts) IP 10.0.0.1 > 10.0.0.99: ICMP echo request, id ${sweep_id}, seq ${sweep_seq}, length 64 FLAG{icmp_detected_2253}" >> "$LOG"
      line=$((line + 1))
      sweep_seq=$((sweep_seq + 1))
    fi

    # Some targets reply (alive hosts)
    if [ "$target_last_octet" -eq 2 ] || [ "$target_last_octet" -eq 5 ] || [ "$target_last_octet" -eq 10 ] || [ "$target_last_octet" -eq 1 ]; then
      tick_fast
      echo "$(ts) IP ${target} > 10.0.0.1: ICMP echo reply, id ${sweep_id}, seq $((sweep_seq - 1)), length 64" >> "$LOG"
      line=$((line + 1))
    fi
  done
done

# --- Phase 3: Post-sweep normal traffic ---
tick_slow
tick_slow
for i in $(seq 7 8); do
  tick_slow
  echo "$(ts) IP 10.0.0.5 > 10.0.0.1: ICMP echo request, id 1001, seq $i, length 64" >> "$LOG"
  line=$((line + 1))
  tick_fast
  echo "$(ts) IP 10.0.0.1 > 10.0.0.5: ICMP echo reply, id 1001, seq $i, length 64" >> "$LOG"
  line=$((line + 1))
done

echo "Capture log generated: $line lines written to $LOG"
