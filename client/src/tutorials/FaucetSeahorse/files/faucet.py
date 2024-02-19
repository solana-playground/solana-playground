from seahorse.prelude import *
from seahorse.pyth import *

declare_id('')

# Faucet
class BitcornFaucet(Account):
   ...


# initialize a new faucet
@instruction
def init_faucet():
  ...


# drips tokens to user
@instruction
def drip_bitcorn_tokens():
    ...


# return unused tokens back to the faucet
@instruction
def replenish_bitcorn_tokens():
    ...

