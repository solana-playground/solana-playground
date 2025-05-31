# fizzbuzz
# Built with Seahorse v0.2.0
#
# On-chain, persistent FizzBuzz!

from seahorse.prelude import *

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('11111111111111111111111111111111')

class FizzBuzz(Account):
  fizz: bool
  buzz: bool
  n: u64

@instruction
def init(owner: Signer, fizzbuzz: Empty[FizzBuzz]):
  fizzbuzz.init(payer = owner, seeds = ['fizzbuzz', owner])

@instruction
def do_fizzbuzz(fizzbuzz: FizzBuzz, n: u64):
  fizzbuzz.fizz = n % 3 == 0
  fizzbuzz.buzz = n % 5 == 0
  if not fizzbuzz.fizz and not fizzbuzz.buzz:
    fizzbuzz.n = n
  else:
    fizzbuzz.n = 0