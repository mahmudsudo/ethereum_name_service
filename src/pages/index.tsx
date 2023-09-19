import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { Dialog, Heading, Input, Profile } from '@ensdomains/thorin'
import {
  useAccount,
  useContractWrite,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
  useWaitForTransaction,
} from 'wagmi'
import MainButton from '../components/connect-button'
import abi from '../utils/abi.json'
import toast, { Toaster } from 'react-hot-toast'
import Gallery from '../components/nft-grid'
import useWindowSize from 'react-use/lib/useWindowSize'
import { usePlausible } from 'next-plausible'
import Confetti from 'react-confetti'

const Home: NextPage = () => {
  const plausible = usePlausible()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({
    addressOrName: ensName || undefined,
  })

  const [name, setName] = useState('')
  const [openDialog, setOpenDialog] = useState<boolean>(false)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)

  const { width: windowWidth, height: windowHeight } = useWindowSize()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  

  const handleFormSubmit = (e: any) => {
    e.preventDefault()
    if (claim.data) return

    // Check for name
    if (!name) {
      toast.error('Please enter a name')
      return
    }

    // Validate name
    if (name.includes(' ') || name.match(/[A-Z]/)) {
      toast.error('Capital letters and spaces are not supported', {
        style: {
          maxWidth: '100%',
        },
      })
      return
    }

   
  }

  const claim = useContractWrite({
    addressOrName: "0x502441D44d38C32C4eF054720d052f196b3Bf9DA",
    contractInterface: abi,
    functionName: 'setDomain',
    chainId: 1, // mainnet
    args: [name],
    mode: 'recklesslyUnprepared',
    onError: (error: { message: string }) => {
      const errMsg: string = error.message

      if (errMsg.includes('Not authorised')) {
        toast.error("You don't own a Lil Noun")
      } else if (errMsg.includes('sub-domain already exists')) {
        toast.error(`${name}.test.eth already exists`)
      } else if (errMsg.includes('user rejected transaction')) {
        toast.error('Transaction rejected')
      } else if (errMsg.includes('Token has already been set')) {
        const hasMultipleNouns = test && test.length > 1

        toast.error(
          `A name has already been claimed with ${
            hasMultipleNouns ? 'this token' : 'your Lil Noun'
          }`,
          {
            style: {
              maxWidth: '100%',
            },
          }
        )
      } else {
        const errReason = errMsg.split('(reason="')[1].split('", method=')[0]
        toast.error(errReason, {
          style: {
            maxWidth: '100%',
          },
        })
      }
    },
  })

  const waitForClaim = useWaitForTransaction({
    chainId: 1,
    hash: claim?.data?.hash,
    onSuccess: (res: { status: number }) => {
      const didFail = res.status === 0
      if (didFail) {
        toast.error('Registration failed')
        plausible('Claim fail')
      } else {
        toast.success('Your name has been registered!')
        setIsRegistered(true)
        plausible('Claim success')
      }
    },
  })

  return (
    <>
      <Head>
        <title>test.eth</title>
        <meta property="og:title" content="test.eth" />
        <meta name="description" content="Claim your test.eth subdomain" />
        <meta
          property="og:description"
          content="Claim your test.eth subdomain"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {mounted && address && (
        <div className="ens-profile">
          <Profile
            address={address}
            ensName={ensName || ''}
            avatar={ensAvatar || undefined}
            dropdownItems={[
              {
                label: 'Disconnect',
                onClick: () => disconnect(),
                color: 'red',
              },
            ]}
          />
        </div>
      )}

      {isRegistered && (
        <Confetti
          width={windowWidth}
          height={windowHeight}
          colors={['#44BCFO', '#7298F8', '#A099FF', '#DE82FF', '#7F6AFF']}
          style={{ zIndex: '1000' }}
        />
      )}

      <main className="wrapper">
        <div className="container">
          <Heading className="title" level="1" align="center">
            test.eth subdomain claim
          </Heading>
          <form className="claim" onSubmit={(e: any) => handleFormSubmit(e)}>
            <Input
              label=""
              name="name"
              placeholder="test"
              disabled={claim.data ? true : false}
              maxLength={42}
              spellCheck={false}
              autoCapitalize="none"
              suffix=".test.eth"
              size="large"
              onChange={(e: { target: { value: any } }) => {
                setName(e.target.value)
              }}
            />
  
          </form>
        </div>
      </main>

      <footer className="footer">
        <a
          href="https://twitter.com/bellomahmud6"
          target="_blank"
          rel="noreferrer"
        >
          @gregskril
        </a>
        <a
          href="https://github.com/mahmudsudo"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </footer>

      
          <MainButton
            isLoading={claim.data && !isRegistered}
            txHash={claim.data?.hash}
            onClick={() => {
              if (claim.data) return
              claim.write?.()
            }}
          />
        </Dialog>
      </div>

      <Toaster position="bottom-center" />
    </>
  )
}

export default Home
