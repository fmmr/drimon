# Mesh Nodes

The greenhouse WiFi is served by a Linksys Velop WHW03v1 mesh (firmware `1.1.19.216893`). The ESP32's status field records the 2.4 GHz BSSID it associated with (`BS-` token, full 6-byte MAC). Use this file to translate a BSSID back to the physical node.

## BSSID → node mapping

Every physical mesh node exposes several radio interfaces (LAN, 2.4 GHz, 5 GHz-1, 5 GHz-2 backhaul, guest, …). Each interface has its own MAC address. Comparing the LAN MAC to the other interface MACs on the same node shows two axes of variation:

- **First byte** varies (`14`, `1A`, `1E`, `26`, …). The LAN MAC uses the vendor OUI first byte (`14`); the other radios use locally-administered variants (LA bit set — the `0x02` bit in the first byte).
- **Last byte** varies (LAN+1, LAN+2, …).

Bytes 1–2 (`91:82`) are part of the Linksys OUI and are constant across every node in this mesh — but we keep them in the key as a cheap safety check against a future non-Linksys AP ever appearing in the BSSID column and accidentally matching on bytes 3–4 alone. So the key uses **bytes 1–4** (8 hex chars): `bs.slice(2, -2).toLowerCase()`.

| Node | Room | LAN IP | LAN MAC | Bytes 1–4 (key) |
|---|---|---|---|---|
| **SOV_MF** | Main router (source) | 192.168.1.1 | `14:91:82:94:F9:C3` | `918294f9` |
| **EXTRA_UTE** | Extended outdoor | 192.168.1.67 | `14:91:82:8F:5F:2E` | `91828f5f` |
| **STUE** | Living room | 192.168.1.166 | `14:91:82:8F:6C:4E` | `91828f6c` |
| **TV_ROM** | TV room | 192.168.1.147 | `14:91:82:95:00:DD` | `91829500` |

The 2.4 GHz radio (which the ESP32 associates with) is typically **LAN MAC + 1 on the last byte** with the LAN OUI first byte. Only SOV_MF's 2.4 GHz BSSID has been observed in production (`14:91:82:94:F9:C4`, ESP32 `BS-14918294f9c4`). If the mesh ever routes the ESP32 to a different radio variant (e.g. `1A:91:82:94:F9:xx`), the middle-4-bytes match will still identify the node correctly.

## Other radio MACs per node

Same node exposes multiple radio interfaces (2.4 GHz, 5 GHz-1, 5 GHz-2 backhaul, guest, etc.). The ESP32 only cares about the 2.4 GHz one, but recording the full set here in case a future check needs to disambiguate.

### EXTRA_UTE
- LAN: `14:91:82:8F:5F:2E`
- `1A:91:82:8F:5F:30`
- `1E:91:82:8F:5F:30`
- `1A:91:82:8F:5F:31`
- `26:91:82:8F:5F:2F`
- IPv6 link-local: `fe80::1691:82ff:fe8f:5f2e`

### STUE
- LAN: `14:91:82:8F:6C:4E`
- `1A:91:82:8F:6C:51`
- `1E:91:82:8F:6C:50`
- `26:91:82:8F:6C:4F`
- IPv6 link-local: `fe80::1691:82ff:fe8f:6c4e`

### TV_ROM
- LAN: `14:91:82:95:00:DD`
- `1A:91:82:95:00:E0`
- `1A:91:82:95:00:DF`
- `1E:91:82:95:00:DF`
- `26:91:82:95:00:DE`
- IPv6 link-local: `fe80::1691:82ff:fe95:00dd`

### SOV_MF
- LAN: `14:91:82:94:F9:C3` (only the LAN MAC was recorded from the admin page since it's the source router)

## Signal strength observed from within the mesh admin

| Node | RSSI at admin scan | Parent |
|---|---|---|
| SOV_MF | (source) | — |
| EXTRA_UTE | −87 dBm | SOV_MF |
| STUE | −87 dBm | EXTRA_UTE |
| TV_ROM | −56 dBm | SOV_MF |

## How the status page uses this

`docs/js/status.js` has a `MESH_NODES` map keyed by bytes 1–4 of the BSSID (8 hex chars, includes the Linksys `91:82` OUI as a vendor safety check) → node name. Matching is done via `bs.slice(2, -2).toLowerCase()`. When rendering the recent-statuses table's "Node" column and the BSSID distribution bar, an unknown key falls back to the raw last-6-hex short form; a known one shows the node name with the full BSSID in the tooltip.

If you add or replace a node, update both this table AND the `MESH_NODES` constant.
