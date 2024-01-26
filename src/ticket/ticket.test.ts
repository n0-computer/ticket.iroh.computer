const { parse } = require('./ticket')


test('parse', () => {
  const cases = [
    // {
    //   "test": "nodeadxnbzqaxmitapxpjveh4frw3pkntovtk6s2zu7jeb3x327basjzgajcnb2hi4dthixs65ltmuys2mjomrsxe4bonfzg62bonzsxi53pojvs4lydabefsibbzofqgagavbcevs4lamasmacaifjxj2aaaaaaaaaaaaia7telam",
    //   "expect": {
    //     type: "node",
    //     "node": {
    //       "node_id": "53iomaf3ceyd532n",
    //       info: {
    //         derp_url: "https://use1-1.derp.iroh.network./",
    //         direct_addresses: [
    //           "72.89.32.33:50635",
    //           "192.168.68.74:50635",
    //           "[2600:4041:5374:e800::100f]:50636",
    //         ]
    //       }
    //     }
    //   }
    // },
    // {
    //   "test": "blobaafsxaq6i57rw23yygvfhqqxxexc53str2abz7alkx2touftzltraajcnb2hi4dthixs65ltmuys2mjomrsxe4bonfzg62bonzsxi53pojvs4lydacwtrxorv6iqgafnhdo5djgyamambkcwg2snqaybyw3jo47egszlhfuyqt6c5srxc7wthxfaanfz3jdbvmxvfuxeljuq",
    //   "expect": {
    //     "type": "blob",
    //     "node": {
    //         "node_id": "bmvyehshp4nww6gb",
    //         "info": {
    //             derp_url: "https://use1-1.derp.iroh.network./",
    //             direct_addresses: [
    //                 "173.56.221.209:51375",
    //                 "173.56.221.209:60452",
    //                 "192.168.86.54:60452",
    //             ],
    //         },
    //     },
    //     "format": "HashSeq",
    //     "hash": "c5b69773e434b2b3969884fc2eca3717ed33dca0034b9da461ab2f52d2e45a69",
    //   }
    // },
    // {
    //   "test": "blobabk62aofuwwwu5zb5ocvzj5v3rtqt6siglyuhoxhqtu4fxravvoteajcnb2hi4dthixs65ltmuys2mjomrsxe4bonfzg62bonzsxi53pojvs4lydaac2cyt22erablaraaa5ciqbfiaqj7ya6cbpuaaaaaaaaaaaahjceamvpumvsvuvet6zjaw5lyuuh6dyhremzztijts57kzxdqmg3zzm6y",
    //   "expect": {
    //     "type": "blob",
    //     "node": {
    //       "node_id": "kxwqdrnfvvvhoipl",
    //       "info": {
    //           "derp_url": "https://use1-1.derp.iroh.network./",
    //           "direct_addresses": [
    //               "5.161.98.122:4433",
    //               "172.17.0.1:4433",
    //               "[2a01:4ff:f0:82fa::1]:4434",
    //           ],
    //       },
    //     },
    //     "format": "HashSeq",
    //     "hash": "957d1959569524fd9482dd5e2943f8783c48cce6684ce5dfab371c186de72cf6"
    //   }
    // },
    // {
    //   "test": "docaaawxqs3ozin5ca2xeyoogei42ibs42ulnq5willcimwaiyrfva2htqbkxwqdrnfvvvhoiplqvokpno4m4e7usbs6fb3vz4e5hbn4ifnluzacitior2ha4z2f4xxk43fgewtcltemvzhaltjojxwqltomv2ho33snmxc6ayaawqwe6wreiakyeiaahiseajkaecp6ahqql5aaaaaaaaaaaab2ira",
    //   "expect": {
    //     "type": "doc",
    //     "capability": "Read",
    //     "namespace": "namespace",
    //     "nodes": [
    //       {
    //         "node_id": "kxwqdrnfvvvhoipl",
    //         "info": {
    //             "derp_url": "https://use1-1.derp.iroh.network./",
    //             "direct_addresses": [
    //                 "5.161.98.122:4433",
    //                 "172.17.0.1:4433",
    //                 "[2a01:4ff:f0:82fa::1]:4434",
    //             ]
    //           }
    //         }
    //     ]
    //   },
    // },
    {
      "test": "docaaacb6elhrcqdaq25orbenr4q3rmdxahc7eykubghl4zhsw25th75slrafk62aofuwwwu5zb5ocvzj5v3rtqt6siglyuhoxhqtu4fxravvoteajcnb2hi4dthixs65ltmuys2mjomrsxe4bonfzg62bonzsxi53pojvs4lydaac2cyt22erablaraaa5ciqbfiaqj7ya6cbpuaaaaaaaaaaaahjce",
      "expect": {
        "capability": "Write",
        "type": "doc",
        "namespace": "7cftyribqinoxiqsgy6inywb3qdrpsmfkatdv6mtzlnozt76zfyq",
        "nodes": [
          {
            "info": {
              "derp_url": "https://use1-1.derp.iroh.network./",
              "direct_addresses": [
                "5.161.98.122:4433",
                "172.17.0.1:4433",
                "[2a01:4ff:f0:82fa::1]:4434",
              ],
            },
            "node_id": "kxwqcaofuwwwugtxehvylik4u625zndhbh5eqebs6fb3vlxhqtu4fmw6ecwv2fjs"
          }
        ]
      }
    }
  ].forEach((c) => {
    let got;
    try {
      got = parse(c.test)
    } catch(e) {
      console.log(`failed on ${e}`)
      expect(e).toBeNull()
    }

    expect(got).toEqual(c.expect)
  })
})